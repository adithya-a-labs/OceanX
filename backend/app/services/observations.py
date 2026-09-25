import json
from pathlib import Path
from typing import Any

from observations import (
    parse_argo_profile,
    filter_valid_measurements,
    match_observation_to_model,
    create_comparison_object,
    load_argo_from_mock,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MOCK_OBSERVATIONS_PATH = PROJECT_ROOT / "data" / "mock" / "observations.json"
MOCK_OCEAN_PATH = PROJECT_ROOT / "data" / "mock" / "ocean-slice.json"


def get_observations(
    variable: str = "temperature",
    depth: int = 0,
    time: str = "2026-09-24T12:00:00Z",
) -> list[dict[str, Any]]:
    observations = load_argo_from_mock(str(MOCK_OBSERVATIONS_PATH))

    return [
        {
            "id": obs["id"],
            "latitude": obs["latitude"],
            "longitude": obs["longitude"],
            "time": obs["time"],
            "variable": variable,
        }
        for obs in observations
    ]


def get_ocean_slice(
    variable: str = "temperature",
    depth: int = 0,
    time: str = "2026-09-24T12:00:00Z",
) -> dict[str, Any]:
    with open(MOCK_OCEAN_PATH) as f:
        ocean_data = json.load(f)

    return ocean_data


def compare_observation(observation_id: str) -> dict[str, Any] | None:
    observations = load_argo_from_mock(str(MOCK_OBSERVATIONS_PATH))

    observation = None
    for obs in observations:
        if obs["id"] == observation_id:
            observation = obs
            break

    if not observation:
        return None

    model_data = get_ocean_slice()
    matched_model = match_observation_to_model(observation, model_data)
    comparison = create_comparison_object(observation, matched_model)

    return comparison