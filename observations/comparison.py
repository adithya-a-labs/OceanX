from typing import Any
import numpy as np


def calculate_differences(
    observed: list[float],
    model: list[float],
) -> list[float]:
    return [float(m - o) for o, m in zip(observed, model, strict=False)]


def calculate_rmse(
    observed: list[float],
    model: list[float],
) -> float:
    if len(observed) != len(model) or len(observed) == 0:
        return 0.0

    obs_arr = np.array(observed)
    model_arr = np.array(model)

    squared_diffs = (obs_arr - model_arr) ** 2
    mse = float(np.mean(squared_diffs))
    return float(np.sqrt(mse))


def create_comparison_object(
    observation: dict[str, Any],
    matched_model: dict[str, Any],
    variable: str = "temperature",
    unit: str = "degC",
) -> dict[str, Any]:
    obs_depths = observation.get("depth", [])
    obs_values = observation.get("temperature", []) if variable == "temperature" else observation.get("salinity", [])

    model_depths = matched_model.get("model_depths", [])
    model_values = matched_model.get("model_profile", [])

    if not obs_depths or not obs_values or not model_depths or not model_values:
        return {
            "id": observation.get("id", "unknown"),
            "latitude": observation.get("latitude"),
            "longitude": observation.get("longitude"),
            "time": observation.get("time"),
            "variable": variable,
            "depth": [],
            "observed": [],
            "model": [],
            "difference": [],
            "rmse": 0.0,
        }

    interp_depths, interp_obs, interp_model = interpolate_profiles(
        obs_depths, obs_values, model_depths, model_values
    )

    differences = calculate_differences(interp_obs, interp_model)
    rmse = calculate_rmse(interp_obs, interp_model)

    return {
        "id": observation.get("id", "unknown"),
        "latitude": observation.get("latitude"),
        "longitude": observation.get("longitude"),
        "time": observation.get("time"),
        "variable": variable,
        "depth": interp_depths,
        "observed": interp_obs,
        "model": interp_model,
        "difference": differences,
        "rmse": round(rmse, 4),
    }


def interpolate_profiles(
    obs_depths: list[float],
    obs_values: list[float],
    model_depths: list[float],
    model_values: list[float],
) -> tuple[list[float], list[float], list[float]]:
    common_depths = sorted(set(obs_depths) | set(model_depths))

    obs_interp = np.interp(common_depths, obs_depths, obs_values, left=np.nan, right=np.nan)
    model_interp = np.interp(common_depths, model_depths, model_values, left=np.nan, right=np.nan)

    valid_mask = ~np.isnan(obs_interp) & ~np.isnan(model_interp)

    final_depths = [common_depths[i] for i in range(len(common_depths)) if valid_mask[i]]
    final_obs = [float(obs_interp[i]) for i in range(len(obs_interp)) if valid_mask[i]]
    final_model = [float(model_interp[i]) for i in range(len(model_interp)) if valid_mask[i]]

    return final_depths, final_obs, final_model