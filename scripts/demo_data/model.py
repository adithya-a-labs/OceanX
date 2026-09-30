"""Catalogue-verified Copernicus forecast subsets and native-grid JSON export."""

import json
import math
from datetime import datetime, timezone

import copernicusmarine
import numpy as np
import xarray as xr

from .config import DATASET_IDS, DATES, RAW, REGION, RENDER_REGION, REQUESTED_DEPTHS, VARIABLE_STANDARDS


def inspect_catalogue():
    catalogue = copernicusmarine.describe(
        product_id="GLOBAL_ANALYSISFORECAST_PHY_001_024", disable_progress_bar=True
    ).model_dump()
    datasets = {d["dataset_id"]: d for p in catalogue["products"] for d in p["datasets"]}
    verified = {}
    versions = {}
    reference_depths = None
    start = datetime.fromisoformat(DATES[0]).replace(tzinfo=timezone.utc).timestamp() * 1000
    end = datetime.fromisoformat(DATES[-1]).replace(tzinfo=timezone.utc).timestamp() * 1000
    for key, standard in VARIABLE_STANDARDS.items():
        source_key = "currents" if key in ("u", "v") else key
        dataset_id = DATASET_IDS[source_key]
        dataset = datasets[dataset_id]
        version = dataset["versions"][0]
        versions[source_key] = version["label"]
        service = next(
            s for part in version["parts"] for s in part["services"]
            if s.get("service_short_name") == "geoseries"
        )
        item = next((v for v in service["variables"] if v.get("standard_name") == standard), None)
        if item is None:
            raise ValueError(f"Catalogue lacks required variable {standard} in {dataset_id}")
        coords = {c["coordinate_id"]: c for c in item["coordinates"]}
        if {"time", "depth", "latitude", "longitude"} - set(coords):
            raise ValueError(f"Catalogue lacks dimensions for {standard}")
        if not coords["time"]["minimum_value"] <= start <= end <= coords["time"]["maximum_value"]:
            raise ValueError(f"Requested dates fall outside {dataset_id}")
        depths = sorted(float(x) for x in coords["depth"]["values"])
        if reference_depths is not None and depths != reference_depths:
            raise ValueError("Forecast datasets have different depth coordinates")
        reference_depths = depths
        verified[key] = {
            "sourceVariable": item["short_name"], "unit": item["units"],
            "standardName": standard, "datasetId": dataset_id,
        }
    selected_depths = [
        {"id": f"depth-{requested}", "requestedDepthM": requested,
         "actualDepthM": min(reference_depths, key=lambda x: abs(x - requested))}
        for requested in REQUESTED_DEPTHS
    ]
    metadata = {
        "datasetVersion": versions["temperature"], "datasetVersions": versions,
        "datasetIds": DATASET_IDS, "variables": verified,
        "depths": selected_depths, "allDepthsM": reference_depths,
    }
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / "verified-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def check_credentials():
    if not copernicusmarine.login(check_credentials_valid=True):
        raise RuntimeError("Run `.venv\\Scripts\\copernicusmarine.exe login` to authenticate.")


def download_subset(metadata):
    check_credentials()
    sources = {}
    variables = {
        "temperature": [metadata["variables"]["temperature"]["sourceVariable"]],
        "salinity": [metadata["variables"]["salinity"]["sourceVariable"]],
        "currents": [metadata["variables"][k]["sourceVariable"] for k in ("u", "v")],
    }
    for key, dataset_id in DATASET_IDS.items():
        source = RAW / f"{key}-render-{DATES[0]}-to-{DATES[-1]}.nc"
        if not source.exists():
            copernicusmarine.subset(
                dataset_id=dataset_id,
                dataset_version=metadata["datasetVersions"][key],
                variables=variables[key],
                minimum_longitude=RENDER_REGION["west"], maximum_longitude=RENDER_REGION["east"],
                minimum_latitude=RENDER_REGION["south"], maximum_latitude=RENDER_REGION["north"],
                minimum_depth=0, maximum_depth=550,
                start_datetime=f"{DATES[0]}T00:00:00",
                end_datetime=f"{DATES[-1]}T23:59:59",
                output_directory=RAW, output_filename=source.name,
                disable_progress_bar=True, skip_existing=True,
            )
        if not source.exists():
            raise RuntimeError(f"Copernicus subset returned without {source}")
        with xr.open_dataset(source) as cached:
            latitude = cached["latitude"] if "latitude" in cached else cached["lat"]
            longitude = cached["longitude"] if "longitude" in cached else cached["lon"]
            if not (RENDER_REGION["south"] - 0.1 <= float(latitude.min()) <= RENDER_REGION["south"] + 0.1
                    and RENDER_REGION["north"] - 0.1 <= float(latitude.max()) <= RENDER_REGION["north"] + 0.1
                    and RENDER_REGION["west"] - 0.1 <= float(longitude.min()) <= RENDER_REGION["west"] + 0.1
                    and RENDER_REGION["east"] - 0.1 <= float(longitude.max()) <= RENDER_REGION["east"] + 0.1):
                raise ValueError(f"Cached subset does not cover the render region: {source}")
        sources[key] = source
    return sources


def _grid(array):
    values = np.asarray(array, dtype=float)
    return [[round(float(x), 5) if math.isfinite(x) else None for x in row] for row in values]


def _write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")),
        encoding="utf-8",
    )


def export_model(sources, metadata, output):
    opened = []
    try:
        for source in sources.values():
            original = xr.open_dataset(source)
            opened.append(original)
        normalized = []
        for original in opened:
            renames = {old: new for old, new in (("lat", "latitude"), ("lon", "longitude"))
                       if old in original.dims}
            normalized.append(original.rename(renames).sortby("latitude").sortby("longitude")
                              .sortby("depth").sortby("time"))
        ds = xr.merge(normalized, join="exact", compat="equals")
        for key, mapping in metadata["variables"].items():
            name = mapping["sourceVariable"]
            if name not in ds:
                raise ValueError(f"Downloaded subset lacks {name}")
            if ds[name].attrs.get("units") != mapping["unit"]:
                raise ValueError(f"Downloaded unit for {name} differs from the catalogue")
            if set(ds[name].dims) != {"time", "depth", "latitude", "longitude"}:
                raise ValueError(f"Unexpected dimensions for {name}")
        if not (float(ds.latitude.min()) < REGION["south"] < REGION["north"] < float(ds.latitude.max())
                and float(ds.longitude.min()) < REGION["west"] < REGION["east"] < float(ds.longitude.max())):
            raise ValueError("Downloaded grid does not pad every side of the analysis region")
        if metadata["variables"]["u"]["unit"] != metadata["variables"]["v"]["unit"]:
            raise ValueError("U and V units differ")
        expected = [np.datetime64(day) for day in DATES]
        actual = list(ds.time.values)
        if len(actual) != len(expected) or any(
            abs((a - b) / np.timedelta64(1, "h")) > 12 for a, b in zip(actual, expected)
        ):
            raise ValueError("Subset timestamps do not match the four requested dates")
        times = []
        latitudes = np.round(ds.latitude.values.astype(float), 6).tolist()
        longitudes = np.round(ds.longitude.values.astype(float), 6).tolist()
        for ti, stamp in enumerate(actual):
            iso = np.datetime_as_string(stamp, unit="s") + "Z"
            time_id = f"t{ti}"
            times.append({"id": time_id, "iso": iso})
            for depth in metadata["depths"]:
                actual_depth = float(ds.depth.sel(depth=depth["requestedDepthM"], method="nearest").values)
                if abs(actual_depth - depth["actualDepthM"]) > 0.01:
                    raise ValueError("Downloaded depth disagrees with verified catalogue")
                for key, mapping in metadata["variables"].items():
                    layer = ds[mapping["sourceVariable"]].isel(time=ti).sel(depth=actual_depth)
                    values = np.asarray(layer.values, dtype=float)
                    finite = values[np.isfinite(values)]
                    if not len(finite):
                        raise ValueError(f"All-null layer: {key} {time_id} {depth['id']}")
                    payload = {
                        "meta": {
                            "variable": key, "unit": mapping["unit"], "time": iso,
                            "requestedDepthM": depth["requestedDepthM"],
                            "actualDepthM": actual_depth, "source": "Copernicus Marine",
                            "datasetId": mapping["datasetId"],
                            "min": round(float(finite.min()), 5),
                            "max": round(float(finite.max()), 5),
                            "rows": len(latitudes), "columns": len(longitudes),
                        },
                        "latitudes": latitudes, "longitudes": longitudes, "values": _grid(values),
                    }
                    _write_json(output / "ocean" / key / time_id / f"{depth['id']}.json", payload)
            surface = metadata["depths"][0]["actualDepthM"]
            u = ds[metadata["variables"]["u"]["sourceVariable"]].isel(time=ti).sel(depth=surface)
            v = ds[metadata["variables"]["v"]["sourceVariable"]].isel(time=ti).sel(depth=surface)
            speed = np.sqrt(u.values ** 2 + v.values ** 2)
            _write_json(output / "currents" / f"{time_id}.json", {
                "meta": {
                    "time": iso, "actualDepthM": surface,
                    "unit": metadata["variables"]["u"]["unit"],
                    "source": "Copernicus Marine", "datasetId": DATASET_IDS["currents"],
                    "rows": len(latitudes), "columns": len(longitudes),
                },
                "latitudes": latitudes, "longitudes": longitudes,
                "u": _grid(u.values), "v": _grid(v.values), "speed": _grid(speed),
            })
        return ds.load(), times
    finally:
        for original in opened:
            original.close()
