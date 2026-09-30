# OceanX demo data

The recording data lives under `frontend/public/demo-data/`. `manifest.json` is the source of truth for Bay of Bengal bounds, actual model depths, time IDs, source variables, and readiness. `demo-sequence.json` pins the recording path. Four QC-filtered observations live in `argo/profiles/<id>.json`. The generator writes `ocean/{temperature,salinity,u,v}/t0..t3/depth-{0,50,100,150,200,500}.json`, `currents/t0..t3.json`, and `comparisons/<id>.json`.

**Current checkout:** `assetsReady` is `true`. The Copernicus model grids, surface currents, Argo profiles, and comparisons are exported. The old `ocean-slices/`, `comparison/`, `currents.json`, and `argo-profiles.json` files are legacy development placeholders and are not read by the current data service or globe adapter.

`data/mock/ocean-slice.json` remains at its legacy path but is now a real, dense copy of the first 100 m temperature layer, generated from the same Copernicus subset.

## Regenerate

Use Python 3.12+ in a virtual environment, then install `scripts/requirements-demo-data.txt`. On Windows:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r scripts/requirements-demo-data.txt
.venv\Scripts\python.exe scripts/prepare_demo_data.py discover
.venv\Scripts\python.exe scripts/prepare_demo_data.py inspect
.venv\Scripts\python.exe scripts/prepare_demo_data.py argo
.venv\Scripts\copernicusmarine.exe login
.venv\Scripts\python.exe scripts/prepare_demo_data.py build
.venv\Scripts\python.exe scripts/prepare_demo_data.py validate
.venv\Scripts\python.exe -m unittest discover -s scripts/tests -v
```

`copernicusmarine login` stores credentials outside the repository. For headless runs, set `COPERNICUSMARINE_SERVICE_USERNAME` and `COPERNICUSMARINE_SERVICE_PASSWORD` in the process environment. Never put them in source or JSON. `build` checks authentication before downloading and gives a clear error if absent. Source NetCDF and GDAC files are cached in ignored `data/raw/`. Only compact JSON is committed.

The source window is 20–23 April 2025. `discover` ranks historical four-day windows using the official GDAC index; this one contained 15 platforms and 23 delayed-mode files in the selected box. Four profiles with valid adjusted temperature, salinity and depth through roughly 2 km were selected. Model grids and currents retain all 121 × 145 native horizontal cells. The three source NetCDF subsets are cached in ignored `data/raw/`.

## Frontend contract

`frontend/src/data` exposes `loadDemoManifest`, `getOceanLayer(variable, depthId, timeId)`, `getCurrents(timeId)`, `getArgoMarkers`, `getArgoProfile(id)`, and `getComparison(id)`. Consumers do not construct paths. Requests are promise cached and rejected requests are evicted. `preloadNearbyFrames` warms adjacent time and depth frames plus currents, markers, and the featured comparison. These functions explicitly reject model requests while `assetsReady` is false.

The Zustand store in `frontend/src/store/useOceanStore.ts` owns `variable`, `depthId`, `timeId`, overlay toggles, and selected Argo ID. The original numeric `depth` and ISO `time` are synchronized for the existing dashboard and globe contract. KKJ can subscribe to state, call `getOceanLayer` or `getCurrents`, and call `selectArgo(id)` on marker click. Anush can use the same store and `getArgoProfile`/`getComparison` without depending on Three.js. The existing dashboard uses a small adapter in `frontend/src/data/legacyAdapter.ts`.

## JSON shapes

Ocean layers for `temperature`, `salinity`, `u`, and `v` contain `meta`, ascending `latitudes`, ascending `longitudes`, and row-major `values` with `null` for missing cells. `meta` contains real unit, ISO time, requested and actual model depth, dataset ID, min/max, rows and columns. The globe adapter reverses rows for its north-first renderer. Surface currents contain matching `u`, `v`, and `speed` grids. Profiles contain pressure-derived `depthM`, `temperatureDegC`, salinity and QC method. Comparisons contain paired `observed`, `model`, `difference = model - observed`, RMSE, and nearest space/time plus linear depth matching details.

The validator checks dimensions, finite values, depth ordering, matching metadata, and comparison arithmetic. It requires all model assets while `assetsReady` is true.
