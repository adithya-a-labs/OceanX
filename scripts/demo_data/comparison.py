"""Paired model-observation calculations, with no depth extrapolation."""

import math

import numpy as np


def rmse(observed, model):
    if len(observed) != len(model):
        raise ValueError("Paired vectors must have equal lengths")
    pairs = [(float(o), float(m)) for o, m in zip(observed, model) if o is not None and m is not None and math.isfinite(o) and math.isfinite(m)]
    if not pairs:
        raise ValueError("No valid model-observation pairs")
    return math.sqrt(sum((m - o) ** 2 for o, m in pairs) / len(pairs))


def compare(profile, model_ds, temperature_name):
    obs_time = np.datetime64(profile["time"].replace("Z", ""))
    at = model_ds.sel(
        time=obs_time, latitude=profile["latitude"], longitude=profile["longitude"],
        method="nearest",
    )
    model_depth = np.asarray(at.depth.values, dtype=float)
    model_temperature = np.asarray(at[temperature_name].values, dtype=float)
    valid = np.isfinite(model_depth) & np.isfinite(model_temperature)
    model_depth, model_temperature = model_depth[valid], model_temperature[valid]
    order = np.argsort(model_depth)
    model_depth, model_temperature = model_depth[order], model_temperature[order]
    pairs = [(d, o) for d, o in zip(profile["depthM"], profile["temperatureDegC"])
             if model_depth[0] <= d <= model_depth[-1] and o is not None and math.isfinite(o)]
    depth = [d for d, _ in pairs]
    observed = [o for _, o in pairs]
    model = np.interp(depth, model_depth, model_temperature).tolist()
    difference = [m - o for o, m in zip(observed, model)]
    result = {
        "observationId": profile["id"], "variable": "temperature", "unit": "degrees_C",
        "depthM": depth, "observed": observed, "model": model,
        "difference": difference, "rmse": rmse(observed, model),
        "match": {
            "observationTime": profile["time"],
            "modelTime": np.datetime_as_string(at.time.values, unit="s") + "Z",
            "observationLatitude": profile["latitude"], "observationLongitude": profile["longitude"],
            "modelLatitude": float(at.latitude.values), "modelLongitude": float(at.longitude.values),
            "spaceMethod": "nearest", "timeMethod": "nearest", "depthMethod": "linear-interpolation",
            "modelDepthRangeM": [float(model_depth[0]), float(model_depth[-1])],
        },
    }
    if difference:
        i = max(range(len(difference)), key=lambda j: abs(difference[j]))
        result["insight"] = f"Largest paired temperature difference is {abs(difference[i]):.2f} °C near {depth[i]:.0f} m."
    return result
