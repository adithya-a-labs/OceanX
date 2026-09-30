"""Read official GDAC core profiles with delayed-mode QC 1 values only."""

from datetime import date, datetime, timedelta, timezone
import gzip
from collections import defaultdict
from pathlib import Path

import gsw
import numpy as np
import requests
import xarray as xr

from .config import DATES, GDAC_BASE, GDAC_INDEX, PROFILE_PATHS, RAW, REGION


def discover_windows():
    """Rank four-day windows by distinct delayed-mode platforms in the region."""
    index = RAW / "ar_index_global_prof.txt.gz"
    RAW.mkdir(parents=True, exist_ok=True)
    if not index.exists():
        with requests.get(GDAC_INDEX, stream=True, timeout=120) as response:
            response.raise_for_status()
            with index.open("wb") as output:
                for chunk in response.iter_content(1024 * 1024):
                    output.write(chunk)
    by_day = defaultdict(list)
    with gzip.open(index, "rt", encoding="utf-8", errors="replace") as lines:
        for line in lines:
            if line.startswith("#") or line.startswith("file,"):
                continue
            fields = line.strip().split(",")
            if len(fields) < 4 or "/D" not in fields[0]:
                continue
            try:
                day = datetime.strptime(fields[1][:8], "%Y%m%d").date()
                latitude, longitude = float(fields[2]), float(fields[3])
            except ValueError:
                continue
            if not (datetime(2024, 1, 1).date() <= day <= datetime(2025, 12, 31).date()):
                continue
            if REGION["south"] <= latitude <= REGION["north"] and REGION["west"] <= longitude <= REGION["east"]:
                by_day[day].append((fields[0].split("/")[1], fields[0]))
    ranked = []
    for start in by_day:
        files = [item for offset in range(4) for item in by_day.get(start + timedelta(days=offset), [])]
        ranked.append({"start": start.isoformat(), "end": (start + timedelta(days=3)).isoformat(),
                       "platformCount": len({platform for platform, _ in files}),
                       "profileCount": len(files), "profiles": files})
    return sorted(ranked, key=lambda item: (-item["platformCount"], -item["profileCount"], item["start"]))


def candidates_in_window(padding_days):
    """Official delayed-mode core profiles within the demo box and padded dates."""
    index = RAW / "ar_index_global_prof.txt.gz"
    if not index.exists():
        discover_windows()  # Download/cache the official GDAC index.
    start = date.fromisoformat(DATES[0]) - timedelta(days=padding_days)
    end = date.fromisoformat(DATES[-1]) + timedelta(days=padding_days)
    paths = set()
    with gzip.open(index, "rt", encoding="utf-8", errors="replace") as lines:
        for line in lines:
            if line.startswith("#") or line.startswith("file,"):
                continue
            fields = line.strip().split(",")
            if len(fields) < 4 or "/D" not in fields[0]:
                continue
            try:
                day = datetime.strptime(fields[1][:8], "%Y%m%d").date()
                latitude, longitude = float(fields[2]), float(fields[3])
            except ValueError:
                continue
            if start <= day <= end and REGION["south"] <= latitude <= REGION["north"] \
                    and REGION["west"] <= longitude <= REGION["east"]:
                paths.add(fields[0].removeprefix("dac/"))
    return sorted(paths)


def download_profiles(paths=PROFILE_PATHS):
    folder = RAW / "argo"
    folder.mkdir(parents=True, exist_ok=True)
    result = []
    for remote in paths:
        destination = folder / Path(remote).name
        if not destination.exists():
            response = requests.get(GDAC_BASE + remote, timeout=90)
            response.raise_for_status()
            destination.write_bytes(response.content)
        result.append((remote, destination))
    return result


def _good(ds, name, row):
    values = np.asarray(ds[f"{name}_ADJUSTED"].values[row], dtype=float)
    qc = ds[f"{name}_ADJUSTED_QC"].values[row]
    values[(qc != b"1") | ~np.isfinite(values)] = np.nan
    return values


def read_profile(remote, path):
    with xr.open_dataset(path, decode_cf=False, mask_and_scale=True) as ds:
        # A file can contain two profiles; select the first complete delayed-mode profile.
        rows = [i for i, mode in enumerate(ds.DATA_MODE.values) if mode == b"D"]
        if not rows:
            raise ValueError(f"No delayed-mode profile in {path}")
        row = max(rows, key=lambda i: np.isfinite(_good(ds, "TEMP", i)).sum())
        latitude = float(ds.LATITUDE.values[row])
        longitude = float(ds.LONGITUDE.values[row])
        pressure = _good(ds, "PRES", row)
        temperature = _good(ds, "TEMP", row)
        salinity = _good(ds, "PSAL", row)
        valid = np.isfinite(pressure) & np.isfinite(temperature) & (pressure >= 0)
        depth = -gsw.z_from_p(pressure[valid], latitude)
        temp = temperature[valid]
        sal = salinity[valid]
        order = np.argsort(depth)
        depth, temp, sal = depth[order], temp[order], sal[order]
        unique = np.r_[True, np.diff(depth) > 0]
        depth, temp, sal = depth[unique], temp[unique], sal[unique]
        if len(depth) < 10 or depth[-1] < 200:
            raise ValueError(f"Insufficient usable depth in {path}")
        juld = float(ds.JULD.values[row])
        timestamp = (datetime(1950, 1, 1, tzinfo=timezone.utc) + timedelta(days=juld)).isoformat(timespec="seconds").replace("+00:00", "Z")
        platform = remote.split("/")[1]
        cycle = int(ds.CYCLE_NUMBER.values[row])
        return {
            "id": f"{platform}-{cycle:03d}",
            "platformId": platform,
            "cycle": cycle,
            "latitude": latitude,
            "longitude": longitude,
            "time": timestamp,
            "source": {"provider": "Argo GDAC", "profileFile": GDAC_BASE + remote, "dataMode": "D"},
            "depthM": np.round(depth, 3).tolist(),
            "temperatureDegC": np.round(temp, 4).tolist(),
            "salinity": [round(float(x), 4) if np.isfinite(x) else None for x in sal],
            "quality": {
                "method": "Delayed-mode adjusted PRES/TEMP/PSAL, each with adjusted QC flag 1",
                "notes": "Pressure (dbar) converted to depth (m) with TEOS-10 gsw.z_from_p at profile latitude; temperature-valid levels retained; invalid salinity is null.",
            },
        }


def profiles_and_markers():
    selected = []
    report = None
    pinned = set(PROFILE_PATHS)
    for padding in (0, 3, 7, 14):
        candidates = candidates_in_window(padding)
        accepted = []
        rejected = []
        for remote, local in download_profiles(candidates):
            try:
                profile = read_profile(remote, local)
                observed = date.fromisoformat(profile["time"][:10])
                if not (date.fromisoformat(DATES[0]) - timedelta(days=padding) <= observed <=
                        date.fromisoformat(DATES[-1]) + timedelta(days=padding)):
                    raise ValueError("NetCDF timestamp outside selected window")
                if not (REGION["south"] <= profile["latitude"] <= REGION["north"] and
                        REGION["west"] <= profile["longitude"] <= REGION["east"]):
                    raise ValueError("NetCDF position outside region")
                accepted.append((remote, profile))
            except (KeyError, ValueError, IndexError) as error:
                rejected.append((remote, str(error)))
        by_platform = defaultdict(list)
        for remote, profile in accepted:
            by_platform[profile["platformId"]].append((remote, profile))
        selected = [max(items, key=lambda item: (
            item[0] in pinned,
            any(value is not None for value in item[1]["salinity"]),
            item[1]["depthM"][-1],
            item[1]["time"],
        ))[1] for items in by_platform.values()]
        selected.sort(key=lambda profile: (profile["time"], profile["id"]))
        report = {"paddingDays": padding, "candidates": len(candidates),
                  "acceptedAfterQc": len(accepted), "uniqueFloats": len(selected),
                  "rejected": rejected}
        if len(selected) >= 10:
            break
    if not pinned.issubset({profile["source"]["profileFile"].removeprefix(GDAC_BASE)
                            for profile in selected}):
        raise ValueError("An existing pinned Argo profile was not retained")
    profiles = selected
    markers = [
        {
            "id": p["id"], "platformId": p["platformId"], "cycle": p["cycle"],
            "latitude": p["latitude"], "longitude": p["longitude"],
            "time": p["time"], "maxDepthM": p["depthM"][-1],
            "hasTemperature": True, "hasSalinity": any(v is not None for v in p["salinity"]),
            "featured": p["id"] == "5907082-059",
        }
        for p in profiles
    ]
    return profiles, markers, report
