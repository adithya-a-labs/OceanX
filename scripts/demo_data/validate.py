"""Validate all exported data products and cross-file references."""

import json
import math
from pathlib import Path

from .comparison import rmse


def read(path):
    def reject(token):
        raise ValueError(f"Non-finite JSON token {token} in {path}")
    return json.loads(Path(path).read_text(encoding="utf-8"), parse_constant=reject)


def grid_shape(values, rows, columns):
    assert len(values) == rows
    assert all(len(row) == columns for row in values)
    assert all(value is None or (isinstance(value, (float, int)) and math.isfinite(value))
               for row in values for value in row)


def validate(output):
    output = Path(output)
    manifest = read(output / "manifest.json")
    markers = read(output / "argo" / "markers.json")
    ids = [m["id"] for m in markers]
    assert len(ids) == len(set(ids)) and len(ids) >= 3
    for marker in markers:
        assert -90 <= marker["latitude"] <= 90 and -180 <= marker["longitude"] <= 180
        assert marker["maxDepthM"] >= 200
        profile = read(output / "argo" / "profiles" / f"{marker['id']}.json")
        assert profile["id"] == marker["id"]
        depth = profile["depthM"]
        assert len(depth) == len(profile["temperatureDegC"]) == len(profile["salinity"])
        assert all(a < b for a, b in zip(depth, depth[1:]))
        assert math.isclose(depth[-1], marker["maxDepthM"])
    if not manifest["assetsReady"]:
        assert not list((output / "ocean").glob("**/*.json"))
        assert not list((output / "currents").glob("*.json"))
        return {"status": "argo-only", "profiles": len(markers)}
    for time in manifest["times"]:
        for depth in manifest["depths"]:
            for variable in ("temperature", "salinity", "u", "v"):
                layer = read(output / "ocean" / variable / time["id"] / f"{depth['id']}.json")
                meta = layer["meta"]
                rows, columns = len(layer["latitudes"]), len(layer["longitudes"])
                grid_shape(layer["values"], rows, columns)
                assert rows == meta["rows"] and columns == meta["columns"]
                assert rows * columns > 10000
                assert all(a < b for a, b in zip(layer["latitudes"], layer["latitudes"][1:]))
                assert all(a < b for a, b in zip(layer["longitudes"], layer["longitudes"][1:]))
                assert layer["latitudes"][0] >= manifest["region"]["south"]
                assert layer["latitudes"][-1] <= manifest["region"]["north"]
                assert layer["longitudes"][0] >= manifest["region"]["west"]
                assert layer["longitudes"][-1] <= manifest["region"]["east"]
                assert meta["actualDepthM"] == depth["actualDepthM"]
                assert meta["time"] == time["iso"] and meta["unit"]
                assert meta["datasetId"] == manifest["variables"][variable]["datasetId"]
                assert math.isfinite(meta["min"]) and meta["min"] <= meta["max"]
        currents = read(output / "currents" / f"{time['id']}.json")
        rows, columns = len(currents["latitudes"]), len(currents["longitudes"])
        for key in ("u", "v", "speed"):
            grid_shape(currents[key], rows, columns)
        assert currents["meta"]["time"] == time["iso"] and currents["meta"]["unit"]
        for urow, vrow, srow in zip(currents["u"], currents["v"], currents["speed"]):
            for u, v, speed in zip(urow, vrow, srow):
                assert speed is None if u is None or v is None else abs(speed - math.hypot(u, v)) < 0.00002
    for marker in markers:
        comparison = read(output / "comparisons" / f"{marker['id']}.json")
        depth = comparison["depthM"]
        observed, model, difference = (comparison[key] for key in ("observed", "model", "difference"))
        assert len(depth) == len(observed) == len(model) == len(difference) > 0
        lower, upper = comparison["match"]["modelDepthRangeM"]
        assert all(lower <= d <= upper for d in depth)
        assert all(abs((m - o) - d) < 1e-8 for o, m, d in zip(observed, model, difference))
        assert abs(rmse(observed, model) - comparison["rmse"]) < 1e-10
    return {"status": "ready", "profiles": len(markers),
            "layers": len(manifest["times"]) * len(manifest["depths"]) * 4}
