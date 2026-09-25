import json
from pathlib import Path
from typing import Any
import numpy as np


def parse_argo_profile(filepath: str | Path) -> dict[str, Any]:
    with open(filepath) as f:
        data = json.load(f)

    if isinstance(data, list):
        return data[0] if data else {}

    return data


def extract_float_metadata(argo_data: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": argo_data.get("platform_number") or argo_data.get("id"),
        "latitude": argo_data.get("latitude") or argo_data.get("lat"),
        "longitude": argo_data.get("longitude") or argo_data.get("lon"),
        "time": argo_data.get("time") or argo_data.get("date"),
    }


def extract_temperature_profile(argo_data: dict[str, Any]) -> tuple[list[float], list[float]]:
    depths = argo_data.get("depth") or argo_data.get("pres") or argo_data.get("pressure") or []
    temps = argo_data.get("temperature") or argo_data.get("temp") or []

    if isinstance(depths, list) and isinstance(temps, list):
        return list(zip(depths, temps, strict=False))

    return []


def extract_salinity_profile(argo_data: dict[str, Any]) -> tuple[list[float], list[float]]:
    depths = argo_data.get("depth") or argo_data.get("pres") or argo_data.get("pressure") or []
    salinity = argo_data.get("salinity") or argo_data.get("psal") or []

    if isinstance(depths, list) and isinstance(salinity, list):
        return list(zip(depths, salinity, strict=False))

    return []


def filter_valid_measurements(
    depths: list[float],
    values: list[float],
    min_depth: float = 0,
    max_depth: float = 2000,
    fill_value: float = -999.0,
) -> tuple[list[float], list[float]]:
    valid_depths = []
    valid_values = []

    for d, v in zip(depths, values, strict=False):
        if (
            d is not None
            and v is not None
            and not np.isnan(v)
            and v != fill_value
            and min_depth <= d <= max_depth
        ):
            valid_depths.append(float(d))
            valid_values.append(float(v))

    return valid_depths, valid_values


def load_argo_from_mock(mock_path: str = "data/mock/observations.json") -> list[dict[str, Any]]:
    with open(mock_path) as f:
        return json.load(f)