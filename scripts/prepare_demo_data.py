"""Prepare and validate the pinned OceanX Bay of Bengal recording assets.

Usage:
    python scripts/prepare_demo_data.py inspect
    python scripts/prepare_demo_data.py argo
    python scripts/prepare_demo_data.py render
    python scripts/prepare_demo_data.py build
    python scripts/prepare_demo_data.py validate
"""

import argparse
import json
from pathlib import Path

import xarray as xr

from demo_data.argo import discover_windows, profiles_and_markers
from demo_data.comparison import compare
from demo_data.config import DATASET_ID, DATASET_IDS, DATES, FEATURED_ID, OUTPUT, PRODUCT_ID, RAW, REGION, RENDER_REGION, ROOT
from demo_data.model import download_subset, export_model, inspect_catalogue
from demo_data.validate import validate


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2) + "\n", encoding="utf-8")


def metadata():
    cached = RAW / "verified-metadata.json"
    if cached.exists():
        value = json.loads(cached.read_text(encoding="utf-8"))
        if value.get("datasetIds") == DATASET_IDS:
            return value
    return inspect_catalogue()


def render_bounds(dataset):
    return {"south": float(dataset.latitude.min()), "north": float(dataset.latitude.max()),
            "west": float(dataset.longitude.min()), "east": float(dataset.longitude.max())}


def manifest(meta, profiles, times=None, bounds=None):
    return {
        "version": 1, "assetsReady": times is not None,
        "region": REGION,
        "analysisBounds": {key: REGION[key] for key in ("south", "north", "west", "east")},
        "renderBounds": bounds or RENDER_REGION,
        "model": {"provider": "Copernicus Marine", "productId": PRODUCT_ID,
                  "datasetId": DATASET_ID, "datasetVersion": meta["datasetVersion"],
                  "datasetIds": DATASET_IDS, "doi": "10.48670/moi-00016"},
        "plannedDates": list(DATES),
        "times": times if times is not None else [
            {"id": f"t{i}", "iso": f"{day}T00:00:00Z", "status": "planned"}
            for i, day in enumerate(DATES)
        ],
        "depths": meta["depths"],
        "variables": meta["variables"],
        "featuredArgoId": FEATURED_ID,
        "argoIds": [p["id"] for p in profiles],
        "provenance": {"model": "real" if times is not None else "catalogue-verified; subset pending authentication",
                       "argo": "real Argo GDAC delayed-mode adjusted QC 1",
                       "insightText": "data-derived" if times is not None else "pending model comparison"},
    }


def sequence(ready):
    return {
        "initial": {"variable": "temperature", "timeId": "t0", "depthId": "depth-0"},
        "requiresModelAssets": True,
        "ready": ready,
        "scenes": [
            {"id": "hero"}, {"id": "bay-zoom"}, {"id": "temperature"},
            {"id": "depth-change", "depthId": "depth-100"},
            {"id": "time-change", "timeId": "t2"},
            {"id": "currents"}, {"id": "argo", "observationId": FEATURED_ID},
            {"id": "comparison", "observationId": FEATURED_ID},
            {"id": "insight", "observationId": FEATURED_ID}, {"id": "final-hero"},
        ],
    }


def export_legacy_slice():
    """Keep the old standalone grid example real and dense as well."""
    layer = json.loads((OUTPUT / "ocean" / "temperature" / "t0" / "depth-100.json").read_text(encoding="utf-8"))
    write(ROOT / "data" / "mock" / "ocean-slice.json", {
        "variable": "temperature", "unit": layer["meta"]["unit"],
        "time": layer["meta"]["time"], "depth": layer["meta"]["actualDepthM"],
        "requestedDepthM": layer["meta"]["requestedDepthM"],
        "source": layer["meta"]["source"], "datasetId": layer["meta"]["datasetId"],
        "bounds": {"north": layer["latitudes"][-1], "south": layer["latitudes"][0],
                   "west": layer["longitudes"][0], "east": layer["longitudes"][-1]},
        "latitudes": layer["latitudes"], "longitudes": layer["longitudes"],
        "values": layer["values"],
    })


def export_argo(meta):
    profiles, markers, report = profiles_and_markers()
    for profile in profiles:
        write(OUTPUT / "argo" / "profiles" / f"{profile['id']}.json", profile)
    write(OUTPUT / "argo" / "markers.json", markers)
    return profiles, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("inspect", "discover", "argo", "render", "build", "validate"))
    args = parser.parse_args()
    if args.command == "inspect":
        print(json.dumps(inspect_catalogue(), indent=2))
        return
    if args.command == "discover":
        for window in discover_windows()[:10]:
            print(f"{window['start']}–{window['end']}: {window['platformCount']} platforms, {window['profileCount']} profiles")
        return
    if args.command == "validate":
        print(validate(OUTPUT))
        return
    meta = metadata()
    if args.command == "render":
        source = download_subset(meta)
        dataset, times = export_model(source, meta, OUTPUT)
        current = json.loads((OUTPUT / "manifest.json").read_text(encoding="utf-8"))
        current["region"] = REGION
        current["analysisBounds"] = {key: REGION[key] for key in ("south", "north", "west", "east")}
        current["renderBounds"] = render_bounds(dataset)
        current["times"] = times
        current["depths"] = meta["depths"]
        current["variables"] = meta["variables"]
        current["model"]["datasetVersion"] = meta["datasetVersion"]
        current["model"]["datasetIds"] = DATASET_IDS
        write(OUTPUT / "manifest.json", current)
        print(validate(OUTPUT))
        return
    if args.command == "argo":
        profiles, report = export_argo(meta)
        current = json.loads((OUTPUT / "manifest.json").read_text(encoding="utf-8"))
        current["argoIds"] = [profile["id"] for profile in profiles]
        current["provenance"]["argo"] = "real Argo GDAC delayed-mode adjusted QC 1"
        if current["assetsReady"]:
            source = RAW / "temperature-2025-04-20-to-23.nc"
            if not source.exists():
                raise FileNotFoundError(f"Cached model NetCDF required for Argo comparisons: {source}")
            with xr.open_dataset(source) as dataset:
                normalized = dataset.rename({key: value for key, value in (("lat", "latitude"), ("lon", "longitude"))
                                             if key in dataset.dims})
                for profile in profiles:
                    write(OUTPUT / "comparisons" / f"{profile['id']}.json",
                          compare(profile, normalized, meta["variables"]["temperature"]["sourceVariable"]))
        write(OUTPUT / "manifest.json", current)
        print(f"Exported {len(profiles)} real Argo GDAC profiles: {report}")
        print(validate(OUTPUT))
        return
    source = download_subset(meta)
    profiles, report = export_argo(meta)
    dataset, times = export_model(source, meta, OUTPUT)
    export_legacy_slice()
    for profile in profiles:
        result = compare(profile, dataset, meta["variables"]["temperature"]["sourceVariable"])
        write(OUTPUT / "comparisons" / f"{profile['id']}.json", result)
    write(OUTPUT / "manifest.json", manifest(meta, profiles, times, render_bounds(dataset)))
    write(OUTPUT / "demo-sequence.json", sequence(True))
    print(f"Argo selection: {report}")
    print(validate(OUTPUT))


if __name__ == "__main__":
    main()
