"""Verified Copernicus catalogue mapping, subset, and compact grid export."""

import json
import math
from datetime import datetime, timezone

import copernicusmarine
import numpy as np
import xarray as xr

from .config import DATASET_ID, DATES, RAW, REGION, REQUESTED_DEPTHS, VARIABLE_STANDARDS


def inspect_catalogue():
    catalogue = copernicusmarine.describe(dataset_id=DATASET_ID, disable_progress_bar=True)
    products = catalogue.model_dump()["products"]
    dataset = next(d for p in products for d in p["datasets"] if d["dataset_id"] == DATASET_ID)
    part = dataset["versions"][0]["parts"][0]
    service = next(s for s in part["services"] if s.get("service_short_name") == "geoseries")
    verified = {}
    for key, standard in VARIABLE_STANDARDS.items():
        item = next((v for v in service["variables"] if v.get("standard_name") == standard), None)
        if item is None:
            raise ValueError(f"Catalogue lacks required variable {standard}")
        coordinates = {c["coordinate_id"]: c for c in item["coordinates"]}
        if set(("time", "depth", "latitude", "longitude")) - set(coordinates):
            raise ValueError(f"Catalogue lacks dimensions for {standard}")
        verified[key] = {"sourceVariable": item["short_name"], "unit": item["units"], "standardName": standard}
    depths = sorted(float(x) for x in coordinates["depth"]["values"])
    start = datetime.fromisoformat(DATES[0]).replace(tzinfo=timezone.utc).timestamp() * 1000
    end = datetime.fromisoformat(DATES[-1]).replace(tzinfo=timezone.utc).timestamp() * 1000
    if not coordinates["time"]["minimum_value"] <= start <= end <= coordinates["time"]["maximum_value"]:
        raise ValueError("Pinned demo dates fall outside the catalogue time range")
    selected_depths = [
        {"id": f"depth-{requested}", "requestedDepthM": requested,
         "actualDepthM": min(depths, key=lambda x: abs(x - requested))}
        for requested in REQUESTED_DEPTHS
    ]
    metadata = {
        "datasetVersion": dataset["versions"][0]["label"],
        "variables": verified,
        "coordinates": {name: {k: v for k, v in value.items() if k != "values"} for name, value in coordinates.items()},
        "depths": selected_depths,
        "allDepthsM": depths,
    }
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / "verified-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def check_credentials():
    if not copernicusmarine.login(check_credentials_valid=True):
        raise RuntimeError(
            "Copernicus Marine credentials are required. Run `copernicusmarine login` "
            "interactively, or set COPERNICUSMARINE_SERVICE_USERNAME and "
            "COPERNICUSMARINE_SERVICE_PASSWORD in your environment. No scientific model "
            "frames or comparisons were generated."
        )


def download_subset(metadata):
    check_credentials()
    source = RAW / "copernicus-bay-of-bengal.nc"
    if not source.exists():
        copernicusmarine.subset(
            dataset_id=DATASET_ID,
            dataset_version=metadata["datasetVersion"],
            variables=[v["sourceVariable"] for v in metadata["variables"].values()],
            minimum_longitude=REGION["west"], maximum_longitude=REGION["east"],
            minimum_latitude=REGION["south"], maximum_latitude=REGION["north"],
            minimum_depth=0, maximum_depth=550,
            start_datetime=DATES[0], end_datetime=DATES[-1],
            output_directory=RAW, output_filename=source.name,
            disable_progress_bar=True, skip_existing=True,
        )
    if not source.exists():
        raise RuntimeError("Copernicus subset request returned without a NetCDF file")
    return source


def _indices(size, target):
    return np.unique(np.rint(np.linspace(0, size - 1, min(size, target))).astype(int))


def _grid(array):
    values = np.asarray(array, dtype=float)
    return [[round(float(x), 5) if math.isfinite(x) else None for x in row] for row in values]


def _write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")), encoding="utf-8")


def export_model(source, metadata, output):
    with xr.open_dataset(source) as original:
        renames = {old: new for old, new in (("lat", "latitude"), ("lon", "longitude")) if old in original.dims}
        ds = original.rename(renames).sortby("latitude").sortby("longitude").sortby("depth").sortby("time")
        for key, mapping in metadata["variables"].items():
            variable = mapping["sourceVariable"]
            if variable not in ds:
                raise ValueError(f"Downloaded subset lacks {variable}")
            if ds[variable].attrs.get("units") != mapping["unit"]:
                raise ValueError(f"Downloaded unit for {variable} differs from the catalogue")
            if set(ds[variable].dims) != {"time", "depth", "latitude", "longitude"}:
                raise ValueError(f"Unexpected dimensions for {variable}")
        if not (REGION["south"] <= float(ds.latitude.min()) <= float(ds.latitude.max()) <= REGION["north"]
                and REGION["west"] <= float(ds.longitude.min()) <= float(ds.longitude.max()) <= REGION["east"]):
            raise ValueError("Downloaded model coordinates fall outside the configured region")
        if metadata["variables"]["u"]["unit"] != metadata["variables"]["v"]["unit"]:
            raise ValueError("U and V units differ")
        expected = [np.datetime64(day) for day in DATES]
        actual = list(ds.time.values)
        if len(actual) != len(expected) or any(abs((a - b) / np.timedelta64(1, "h")) > 12 for a, b in zip(actual, expected)):
            raise ValueError("Subset timestamps do not match the pinned four-day recording window")
        lat_index = _indices(ds.sizes["latitude"], 100)
        lon_index = _indices(ds.sizes["longitude"], 120)
        current_lat_index = _indices(ds.sizes["latitude"], 26)
        current_lon_index = _indices(ds.sizes["longitude"], 26)
        times = []
        for ti, stamp in enumerate(actual):
            iso = np.datetime_as_string(stamp, unit="s") + "Z"
            time_id = f"t{ti}"
            times.append({"id": time_id, "iso": iso})
            for depth in metadata["depths"]:
                actual_depth = float(ds.depth.sel(depth=depth["requestedDepthM"], method="nearest").values)
                if abs(actual_depth - depth["actualDepthM"]) > 0.01:
                    raise ValueError("Downloaded model depth disagrees with verified catalogue")
                for variable in ("temperature", "salinity"):
                    mapping = metadata["variables"][variable]
                    layer = ds[mapping["sourceVariable"]].isel(time=ti).sel(depth=actual_depth).isel(latitude=lat_index, longitude=lon_index)
                    grid = _grid(layer.values)
                    finite = np.asarray(layer.values, dtype=float)
                    finite = finite[np.isfinite(finite)]
                    if not len(finite):
                        raise ValueError(f"All-null layer: {variable} {time_id} {depth['id']}")
                    payload = {
                        "meta": {"variable": variable, "unit": mapping["unit"], "time": iso,
                                 "requestedDepthM": depth["requestedDepthM"], "actualDepthM": actual_depth,
                                 "source": "Copernicus Marine", "datasetId": DATASET_ID,
                                 "min": round(float(finite.min()), 5), "max": round(float(finite.max()), 5),
                                 "rows": len(grid), "columns": len(grid[0])},
                        "latitudes": np.round(layer.latitude.values.astype(float), 6).tolist(),
                        "longitudes": np.round(layer.longitude.values.astype(float), 6).tolist(),
                        "values": grid,
                    }
                    _write_json(output / "ocean" / variable / time_id / f"{depth['id']}.json", payload)
            surface = float(ds.depth.sel(depth=0, method="nearest").values)
            u_name = metadata["variables"]["u"]["sourceVariable"]
            v_name = metadata["variables"]["v"]["sourceVariable"]
            u = ds[u_name].isel(time=ti).sel(depth=surface).isel(latitude=current_lat_index, longitude=current_lon_index)
            v = ds[v_name].isel(time=ti).sel(depth=surface).isel(latitude=current_lat_index, longitude=current_lon_index)
            speed = np.sqrt(u.values ** 2 + v.values ** 2)
            _write_json(output / "currents" / f"{time_id}.json", {
                "meta": {"time": iso, "actualDepthM": surface, "unit": metadata["variables"]["u"]["unit"],
                         "source": "Copernicus Marine", "datasetId": DATASET_ID,
                         "rows": len(u.latitude), "columns": len(u.longitude)},
                "latitudes": np.round(u.latitude.values.astype(float), 6).tolist(),
                "longitudes": np.round(u.longitude.values.astype(float), 6).tolist(),
                "u": _grid(u.values), "v": _grid(v.values), "speed": _grid(speed),
            })
        return ds.load(), times
