# OceanX MVP Architecture

## Flow
1. `ocean_data/` reads and subsets model data.
2. `backend/` exposes stable APIs.
3. `frontend/` renders the globe, controls and charts.
4. `observations/` loads Argo profiles and compares them with the model.
5. `analytics/` prepares currents and simple indicators.

## Ownership
- Member 1: `frontend/src/globe/`
- Member 2: `frontend/src/dashboard/`, `frontend/src/charts/`
- Member 3: `ocean_data/`
- Member 4: `backend/`, `frontend/src/api/`
- Member 5: `observations/`
- Member 6: `analytics/`, Docker, scripts, integration tests
