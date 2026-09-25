from typing import Any
import numpy as np


def find_nearest_grid_point(
    target_lat: float,
    target_lon: float,
    model_lats: list[float],
    model_lons: list[float],
) -> tuple[int, int]:
    lat_idx = int(np.argmin(np.abs(np.array(model_lats) - target_lat)))
    lon_idx = int(np.argmin(np.abs(np.array(model_lons) - target_lon)))
    return lat_idx, lon_idx


def find_nearest_time_index(
    target_time: str,
    model_times: list[str],
) -> int:
    from datetime import datetime

    target = datetime.fromisoformat(target_time.replace("Z", "+00:00"))
    time_diffs = []

    for t in model_times:
        model_time = datetime.fromisoformat(t.replace("Z", "+00:00"))
        diff = abs((target - model_time).total_seconds())
        time_diffs.append(diff)

    return int(np.argmin(time_diffs))


def match_observation_to_model(
    observation: dict[str, Any],
    model_data: dict[str, Any],
) -> dict[str, Any]:
    obs_lat = observation["latitude"]
    obs_lon = observation["longitude"]
    obs_time = observation["time"]

    model_lats = model_data.get("latitudes", [])
    model_lons = model_data.get("longitudes", [])
    model_times = model_data.get("time", [])
    if isinstance(model_times, str):
        model_times = [model_times]
    elif not isinstance(model_times, list):
        model_times = [str(model_times)]

    lat_idx, lon_idx = find_nearest_grid_point(obs_lat, obs_lon, model_lats, model_lons)
    time_idx = find_nearest_time_index(obs_time, model_times)

    model_profile = []
    depths = model_data.get("depths", [])

    if "values" in model_data and isinstance(model_data["values"], list):
        values = model_data["values"]
        if len(values) > time_idx:
            time_slice = values[time_idx]
            if isinstance(time_slice, list):
                model_profile = []
                for depth_idx in range(len(time_slice)):
                    depth_slice = time_slice[depth_idx]
                    if isinstance(depth_slice, list) and len(depth_slice) > lat_idx:
                        lat_slice = depth_slice[lat_idx]
                        if isinstance(lat_slice, list) and len(lat_slice) > lon_idx:
                            model_profile.append(lat_slice[lon_idx])

    return {
        "lat_idx": lat_idx,
        "lon_idx": lon_idx,
        "time_idx": time_idx,
        "model_profile": model_profile,
        "model_depths": depths,
        "matched_lat": model_lats[lat_idx] if model_lats else obs_lat,
        "matched_lon": model_lons[lon_idx] if model_lons else obs_lon,
        "matched_time": model_times[time_idx] if model_times else obs_time,
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