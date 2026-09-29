"""Prepare and validate the pinned OceanX Bay of Bengal recording assets.

Usage:
    python scripts/prepare_demo_data.py inspect
    python scripts/prepare_demo_data.py argo
    python scripts/prepare_demo_data.py build
    python scripts/prepare_demo_data.py validate
"""

import argparse
import json
from pathlib import Path

from demo_data.argo import discover_windows, profiles_and_markers
from demo_data.comparison import compare
from demo_data.config import DATASET_ID, DATES, FEATURED_ID, OUTPUT, PRODUCT_ID, RAW, REGION
from demo_data.model import download_subset, export_model, inspect_catalogue
from demo_data.validate import validate


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2) + "\n", encoding="utf-8")


def metadata():
    cached = RAW / "verified-metadata.json"
    return json.loads(cached.read_text(encoding="utf-8")) if cached.exists() else inspect_catalogue()


def manifest(meta, profiles, times=None):
    return {
        "version": 1, "assetsReady": times is not None,
        "region": REGION,
        "model": {"provider": "Copernicus Marine", "productId": PRODUCT_ID,
                  "datasetId": DATASET_ID, "datasetVersion": meta["datasetVersion"],
                  "doi": "10.48670/moi-00021"},
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


def export_argo(meta):
    profiles, markers = profiles_and_markers()
    for profile in profiles:
        write(OUTPUT / "argo" / "profiles" / f"{profile['id']}.json", profile)
    write(OUTPUT / "argo" / "markers.json", markers)
    write(OUTPUT / "manifest.json", manifest(meta, profiles))
    write(OUTPUT / "demo-sequence.json", sequence(False))
    return profiles


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("inspect", "discover", "argo", "build", "validate"))
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
    profiles = export_argo(meta)
    if args.command == "argo":
        print(f"Exported {len(profiles)} real Argo GDAC profiles. Model assets remain pending.")
        print(validate(OUTPUT))
        return
    source = download_subset(meta)
    dataset, times = export_model(source, meta, OUTPUT)
    for profile in profiles:
        result = compare(profile, dataset, meta["variables"]["temperature"]["sourceVariable"])
        write(OUTPUT / "comparisons" / f"{profile['id']}.json", result)
    write(OUTPUT / "manifest.json", manifest(meta, profiles, times))
    write(OUTPUT / "demo-sequence.json", sequence(True))
    print(validate(OUTPUT))


if __name__ == "__main__":
    main()
