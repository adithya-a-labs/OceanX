import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from app.services.observations import get_observations, get_ocean_slice, compare_observation

app = FastAPI(title="OceanX API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/metadata")
def metadata():
    return {
        "variables": [
            {"name": "temperature", "unit": "degC"},
            {"name": "salinity", "unit": "PSU"},
            {"name": "currents", "unit": "m/s"},
        ],
        "depths": [0, 10, 20, 50, 100, 200, 500],
        "times": ["2026-09-24T12:00:00Z"],
        "bounds": {"north": 18, "south": 12, "west": 82, "east": 90},
    }


@app.get("/api/ocean")
def ocean_slice(
    variable: str = Query("temperature"),
    depth: int = Query(0),
    time: str = Query("2026-09-24T12:00:00Z"),
):
    data = get_ocean_slice(variable, depth, time)
    return data


@app.get("/api/observations")
def observations(
    variable: str = Query("temperature"),
    depth: int = Query(0),
    time: str = Query("2026-09-24T12:00:00Z"),
):
    data = get_observations(variable, depth, time)
    return data


@app.get("/api/compare/{observation_id}")
def compare(observation_id: str):
    result = compare_observation(observation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Observation not found")
    return result