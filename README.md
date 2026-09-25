# OceanX 🌊

OceanX is the **SIH 2026 MVP for an interactive 3D ocean exploration platform** — think **Google Earth for the ocean**.

Instead of only looking at the sea surface, OceanX lets a user explore the ocean across **location, depth and time**, view scientific variables such as temperature, salinity and currents, and compare ocean-model predictions with **real Argo float observations**.

## MVP focus

The first prototype is intentionally small and focused:

- **Pilot region:** Bay of Bengal
- **Model variables:** Temperature, Salinity, U/V ocean currents
- **Observation source:** Argo profiling floats
- **Depth interaction:** Surface to roughly 500 m where data is available
- **Time interaction:** A small, repeatable demo time window
- **Validation:** Model vs observation profile comparison
- **Indicator:** One simple automatic warning based on model-observation mismatch

### MVP demo flow

1. Open OceanX.
2. View the 3D Earth.
3. Zoom to the Bay of Bengal.
4. Select Temperature, Salinity or Currents.
5. Change depth and watch the ocean layer update.
6. Change time and watch the data update.
7. Turn on Argo observations.
8. Click an Argo float.
9. Compare the model profile with the observed profile.
10. View RMSE / mismatch information.
11. Show current flow and one simple automatic indicator.

If this complete flow works reliably, the MVP succeeds.

---

# Repository structure

OceanX is a **monorepo** so all six members work in the same project while owning separate modules.

```text
OceanX/
├── frontend/
│   └── src/
│       ├── globe/          # Amulya
│       ├── dashboard/      # Krishna Anilraj
│       ├── charts/         # Krishna Anilraj
│       ├── api/            # Prabhu
│       ├── state/          # Shared frontend state
│       └── types/          # Shared contracts
│
├── backend/                # Prabhu
│   └── app/
│       ├── api/
│       ├── schemas/
│       └── services/
│
├── ocean_data/             # Adithya
├── observations/           # Anush
├── analytics/              # Krishna Kumar Jha
│
├── data/
│   ├── mock/
│   └── sample/
│
├── docs/
├── scripts/
├── tests/
└── docker-compose.yml
```

---

# Branches

| Member | Branch | Main ownership |
|---|---|---|
| Amulya | `feat/globe` | 3D globe and ocean visualization |
| Krishna Anilraj | `feat/dashboard` | Dashboard, controls and charts |
| Adithya | `feat/ocean-data` | NetCDF/Xarray data pipeline |
| Prabhu | `feat/backend-api` | FastAPI backend and frontend API client |
| Anush | `feat/argo-validation` | Argo observations and model validation |
| Krishna Kumar Jha | `feat/integration` | Currents, indicators, Docker and integration |

Permanent branches:

- `main` — stable/demo-ready versions only
- `develop` — shared integration branch

Feature work should normally merge into `develop` through pull requests.

---

# Team roles and scope

## Team roster

| Name | Role |
|---|---|
| **Amulya** | 3D Globe & Ocean Visualization |
| **Krishna Anilraj** | Dashboard, Controls & Scientific UI |
| **Adithya** | Ocean Data Pipeline |
| **Prabhu** | Backend API & Data Gateway |
| **Anush** | Argo Observations & Model Validation |
| **Krishna Kumar Jha** | Currents, Indicators & Integration + Frontend Oversight |

**Frontend team:** Amulya + Krishna Anilraj, with **Krishna Kumar Jha overseeing frontend development, architecture and integration quality**.

---

## Amulya — 3D Globe & Ocean Visualization

**Branch:** `feat/globe`  
**Primary folder:** `frontend/src/globe/`

### Main goal

Build the interactive visual experience that makes OceanX feel like **Google Earth for the ocean**.

### Scope

Amulya owns:

- 3D Earth / globe
- Camera movement, zoom and rotation
- Bay of Bengal visualization
- Mapping latitude/longitude onto the globe
- Temperature layer rendering
- Salinity layer rendering
- Current-vector overlay integration
- Argo marker rendering
- Clicking/selecting markers
- Updating the ocean visualization when depth or time changes
- Basic rendering performance

### Work checklist

- [ ] Create the 3D globe
- [ ] Add camera rotate/zoom controls
- [ ] Focus the initial demo on the Bay of Bengal
- [ ] Render a mock temperature field
- [ ] Connect to real ocean-slice data from the API
- [ ] Support temperature and salinity layers
- [ ] React to depth changes
- [ ] React to time changes
- [ ] Display current arrows/particles from Krishna Kumar Jha
- [ ] Display Argo markers from Anush
- [ ] Make observation markers clickable
- [ ] Handle loading/no-data states
- [ ] Check performance on the demo laptop

### Inputs from other members

- Ocean slices from Prabhu
- UI state from Krishna Anilraj
- Argo marker data from Anush
- Current vectors from Krishna Kumar Jha

### Definition of done

A user can move around the globe, see real ocean data, change depth/time, and view Argo/current overlays without the scene breaking.

---

## Krishna Anilraj — Dashboard, Controls & Scientific UI

**Branch:** `feat/dashboard`  
**Primary folders:** `frontend/src/dashboard/`, `frontend/src/charts/`

### Main goal

Build everything the user **clicks, reads and understands** around the 3D ocean.

### Scope

Krishna Anilraj owns:

- Main application layout
- Variable selector
- Depth selector
- Time selector
- Layer toggles
- Legends and units
- Observation details panel
- Model-vs-observation profile chart
- RMSE/mismatch display
- Loading/error states
- Shared frontend interaction state

### Work checklist

- [ ] Build the dashboard shell
- [ ] Add Temperature / Salinity / Currents selector
- [ ] Add depth slider or selector
- [ ] Add time control
- [ ] Add Argo toggle
- [ ] Add currents toggle
- [ ] Add color legend and units
- [ ] Add loading/error states
- [ ] Add selected-Argo information panel
- [ ] Plot observed vs model profile
- [ ] Display RMSE/mismatch
- [ ] Connect all controls to shared state
- [ ] Make the layout usable on the demo laptop

### Inputs from other members

- Metadata/API values from Prabhu
- Selected observation/comparison data from Anush
- Indicators from Krishna Kumar Jha

### Definition of done

A new user can understand how to switch variables, change depth/time, turn layers on/off, click an observation and understand the comparison chart.

---

## Adithya — Ocean Data Pipeline

**Branch:** `feat/ocean-data`  
**Primary folder:** `ocean_data/`

### Main goal

Turn real scientific ocean files into **small, clean data slices** that the rest of OceanX can use.

### Scope

Adithya owns:

- NetCDF/HDF5 inspection
- Xarray loading
- Understanding dimensions and coordinates
- Temperature extraction
- Salinity extraction
- U/V current extraction
- Latitude/longitude normalization
- Depth selection
- Time selection
- Geographic bounding-box subsetting
- Missing-value handling
- Basic downsampling if required

### Work checklist

- [ ] Choose one reliable Bay of Bengal model dataset
- [ ] Load it using Xarray
- [ ] Identify variables and units
- [ ] Identify latitude/longitude format
- [ ] Identify depth levels
- [ ] Identify time steps
- [ ] Handle longitude convention if needed
- [ ] Handle missing/fill values
- [ ] Extract a 2D temperature slice
- [ ] Extract salinity
- [ ] Extract U and V currents
- [ ] Support bounding-box selection
- [ ] Support depth selection
- [ ] Support time selection
- [ ] Return data using the shared contract
- [ ] Test several depth/time combinations

### Output

Adithya should provide functions that conceptually answer:

> Give me this variable, for this region, at this depth and time.

### Definition of done

Given variable + depth + time + geographic bounds, the module reliably returns the correct clean model-data slice without exposing raw-file complexity to the frontend.

> **MVP priority:** working Xarray extraction comes before Kerchunk/VirtualiZarr optimization.

---

## Prabhu — Backend API & Data Gateway

**Branch:** `feat/backend-api`  
**Primary folders:** `backend/`, `frontend/src/api/`

### Main goal

Create the stable bridge between scientific Python modules and the web frontend.

### Scope

Prabhu owns:

- FastAPI application
- Metadata endpoint
- Ocean-data endpoint
- Observation endpoint
- Comparison endpoint
- Request validation
- Response schemas
- Error handling
- CORS
- Frontend API client
- Basic caching if required

### Core MVP endpoints

```text
GET /api/metadata
GET /api/ocean
GET /api/observations
GET /api/compare/{observation_id}
```

### Work checklist

- [ ] Set up FastAPI
- [ ] Add a health endpoint
- [ ] Create mock metadata response
- [ ] Create mock ocean-data response
- [ ] Freeze response formats with frontend members
- [ ] Connect ocean endpoint to Adithya
- [ ] Add observations endpoint
- [ ] Add comparison endpoint
- [ ] Validate variable/depth/time parameters
- [ ] Configure CORS
- [ ] Add useful errors/status codes
- [ ] Add frontend API helper functions
- [ ] Add basic caching only if necessary
- [ ] Test generated API documentation

### Inputs from other members

- Scientific model functions from Adithya
- Argo/comparison functions from Anush
- Indicator outputs from Krishna Kumar Jha if exposed through the API

### Definition of done

The frontend can request metadata, ocean slices, observations and comparison results through predictable endpoints and receive valid responses consistently.

---

## Anush — Argo Observations & Model Validation

**Branch:** `feat/argo-validation`  
**Primary folder:** `observations/`

### Main goal

Connect the virtual ocean model with **real ocean measurements**.

### Scope

Anush owns:

- Argo profile ingestion
- Float ID/location/time extraction
- Temperature profile extraction
- Salinity profile extraction where useful
- Quality/missing-value filtering
- Observation-to-model location matching
- Observation-to-model time matching
- Model profile sampling
- Depth interpolation
- Point-by-point comparison
- RMSE calculation

### Work checklist

- [ ] Obtain several Argo profiles in the demo region/time
- [ ] Parse float ID
- [ ] Parse latitude/longitude
- [ ] Parse observation timestamp
- [ ] Parse temperature profile
- [ ] Parse salinity profile if used
- [ ] Filter invalid measurements
- [ ] Match observation to model time
- [ ] Match observation to model grid location
- [ ] Obtain the corresponding model profile
- [ ] Interpolate profiles onto comparable depths
- [ ] Calculate point-by-point differences
- [ ] Calculate RMSE
- [ ] Return the shared comparison object
- [ ] Test at least 3–5 observations

### Inputs from other members

- Model-data access from Adithya
- API exposure through Prabhu

### Definition of done

Selecting an Argo float can produce a clear model-vs-observation profile and an RMSE/mismatch value.

---

## Krishna Kumar Jha — Currents, Indicators & Integration

**Branch:** `feat/integration`  
**Primary folders/files:** `analytics/`, `scripts/`, integration tests, Docker configuration

### Main goal

Make OceanX feel alive with current flow, make sure **all six members' work actually runs together**, and **oversee frontend development** so the globe, dashboard, shared state and API integration stay consistent.

### Scope

Krishna Kumar Jha owns three areas.

#### 1. Ocean currents

- Consume U/V current components
- Calculate speed/direction where needed
- Downsample current vectors for visualization
- Give Amulya a simple render-friendly vector format

#### 2. MVP indicator

Implement one simple automatic insight.

Recommended first indicator:

> Show a warning when model-observation RMSE exceeds a configurable threshold.

#### 3. Frontend oversight

- Review frontend architecture and integration decisions
- Coordinate Amulya's globe work with Krishna Anilraj's dashboard/state work
- Check that frontend uses shared types and API contracts correctly
- Review frontend PRs that affect cross-module behavior
- Help resolve integration/performance issues without taking over their day-to-day feature implementation

#### 4. Integration

- Docker/dev setup
- Environment variables
- Integration branch health
- End-to-end tests
- Demo startup
- Final system reliability

### Work checklist

- [ ] Understand U/V current components
- [ ] Convert U/V to render-friendly vectors
- [ ] Downsample vectors if needed
- [ ] Agree on vector format with Amulya
- [ ] Implement one configurable indicator
- [ ] Review major frontend integration changes
- [ ] Check globe/dashboard compatibility before merge
- [ ] Maintain `.env.example`
- [ ] Finish Docker/dev startup
- [ ] Maintain integration tests
- [ ] Verify frontend + backend communication
- [ ] Verify model-data integration
- [ ] Verify Argo integration
- [ ] Verify comparison chart
- [ ] Verify currents
- [ ] Verify indicator
- [ ] Run the full demo repeatedly
- [ ] Document known limitations

### Definition of done

Ocean currents render correctly, one automated insight works, and the whole OceanX MVP can be launched and demonstrated reliably.

---

# Shared contracts

The modules communicate through agreed data structures.

See:

- `docs/api-contract.md`
- `docs/data-contract.md`

These are **team contracts**. Do not change them casually.

If a breaking change is needed:

1. Discuss it with affected members.
2. Agree on the new format.
3. Update the contract documentation.
4. Update affected modules.
5. Merge together.

---

# Parallel-development rule

Nobody should wait for another member to finish.

Examples:

- Members 1 and 2 start with `data/mock/`.
- Prabhu serves mock API responses before real science modules are ready.
- Adithya develops/test the ocean pipeline independently.
- Anush develops Argo parsing/comparison independently.
- Krishna Kumar Jha develops current-vector transformation using sample U/V data.

As real components become ready, replace mocks without changing the contract.

---

# Git workflow

Start from your assigned feature branch.

Example:

```bash
git checkout develop
git pull

git checkout feat/globe
git merge develop
```

During work:

```bash
git add .
git commit -m "feat(globe): render temperature layer"
git push origin feat/globe
```

Then open a pull request:

```text
feature branch
      ↓
Pull Request
      ↓
develop
```

Use small pull requests and keep `develop` runnable.

Useful commit prefixes:

```text
feat(globe):
feat(ui):
feat(data):
feat(api):
feat(argo):
feat(analytics):
fix(...):
docs:
chore:
```

---

# Important MVP boundaries

Do **not** delay the MVP for:

- Full global coverage
- Advanced WebGPU implementation
- Full volumetric ray-marching
- Production-scale Kerchunk infrastructure
- Search-and-rescue drift simulation
- Marine heatwave engine
- Every observation platform
- AI assistant
- Production cloud architecture

First make this work:

**real model data → API → interactive 3D ocean → depth/time → Argo → model vs reality → currents → one indicator**

---

# Documentation

- `docs/architecture.md` — system structure and ownership
- `docs/api-contract.md` — backend/frontend interface
- `docs/data-contract.md` — shared scientific-data formats
- `docs/team-workflow.md` — Git and collaboration rules
