# OceanX 🌊

OceanX is an **interactive 3D ocean exploration prototype** for SIH 2026 — think **Google Earth for the ocean**.

Instead of stopping at the sea surface, OceanX lets a user explore the ocean across **location, depth and time**, visualize **temperature, salinity and currents**, and compare ocean-model values with **real-world Argo observations**.

> **Current submission goal:** build an exceptional, believable frontend that can be presented through a polished **YouTube video**. Production-scale backend/data infrastructure comes later.

---

# Submission strategy

For this stage, effort is intentionally concentrated on what is visible in the video:

| Priority | Approx. effort | Focus |
|---|---:|---|
| Frontend quality | 60% | 3D globe, UI/UX, charts, visual polish |
| Interaction & motion | 20% | Camera motion, sliders, current flow, transitions |
| Demo data | 10% | Real/curated lightweight ocean data |
| Video & story | 10% | Script, scene order, captions, recording |

The rule is simple:

> If a task does not noticeably improve the frontend, scientific credibility, interaction quality, or final video, it is not a priority for this submission stage.

---

# Active team

The active build team is now **4 people**, working in parallel.

| Name | Role | Branch |
|---|---|---|
| **Krishna Kumar Jha** | Frontend Engineering Lead, 3D & Integration | `feat/integration` |
| **Anush** | Frontend Design Lead, UI/UX & Argo Experience | `feat/argo-validation` |
| **Adithya** | Demo Data, Scientific Direction & Video | `feat/ocean-data` |
| **Prabhu** | Frontend State, Data & Interaction Logic | `feat/backend-api` |

Permanent branches:

- `main` — stable/demo-ready versions
- `develop` — shared integration branch

> **Central rule:** `develop` should always contain a complete, recordable demo path.

---

# Locked frontend stack

To avoid wasting time on library decisions, the submission build uses:

| Area | Choice |
|---|---|
| 3D | Three.js / React Three Fiber |
| Charts | **Apache ECharts** |
| Styling | **Tailwind CSS** |
| State | **Zustand** |
| Demo data | **`frontend/public/demo-data/`** |
| Recording target | **1920×1080, 16:9** |

Why:

- **ECharts** gives us cleaner styling and animation for scientific profile charts.
- **Tailwind** makes rapid visual iteration easier across the frontend.
- **Zustand** keeps the globe, controls, timeline and Argo selection synchronized without Redux overhead.
- **public/demo-data** keeps the prototype self-contained and easy to replace with a real backend later.

---

# Product demo flow

The frontend is built around this exact recording sequence:

1. OceanX opens on a beautiful 3D Earth.
2. Camera zooms smoothly to the **Bay of Bengal**.
3. **Temperature** layer appears.
4. Depth changes from surface → 100 m → deeper.
5. Prepared time frames animate.
6. **Currents** turn on with arrows/particles.
7. **Argo observations** appear.
8. User selects one Argo float.
9. A premium details panel opens.
10. **Model vs Observation** profile chart appears.
11. RMSE/mismatch is shown.
12. One scientific insight/alert appears.
13. Video ends on a polished hero shot.

If this sequence is smooth, understandable and visually strong, the submission-stage prototype succeeds.

---

# 4-person parallel architecture

```text
                    Adithya
          Demo data + scientific story
                       │
                       ▼
                     Prabhu
          State + data + interaction logic
                 │             │
                 ▼             ▼
                KKJ           Anush
          3D / currents    UI / UX / Argo
                 │             │
                 └──────┬──────┘
                        ▼
               Recording-ready OceanX
                        │
                        ▼
                YouTube submission
```

Nobody should need to wait for another person to finish:

- KKJ starts with mock arrays.
- Anush starts with static UI/mock data.
- Adithya prepares real/curated data independently.
- Prabhu builds Zustand state + local data loaders against the existing mock files.

---

# Krishna Kumar Jha — Frontend Engineering Lead, 3D & Integration

**Branch:** `feat/integration`

## Owns

### 3D engine
- 3D globe
- camera motion
- Bay of Bengal zoom
- temperature/salinity rendering
- Argo marker rendering
- current arrows/particles
- performance

### Frontend engineering
- technical frontend architecture
- globe/UI integration
- state synchronization with Prabhu
- animation timing
- final recording-ready build

## Checklist

- [ ] Maintain working globe
- [ ] Add camera presets / cinematic movement
- [ ] Render temperature layer
- [ ] Render salinity layer
- [ ] Connect depth/time state
- [ ] Render Argo markers
- [ ] Connect selected marker state
- [ ] Build current-flow animation
- [ ] Tune performance for 1080p recording
- [ ] Integrate Anush's UI
- [ ] Test the complete video path
- [ ] Keep `develop` recordable

## Definition of done

The visual engine runs smoothly from opening shot through ocean layers, currents, Argo selection and final hero view.

---

# Anush — Frontend Design Lead, UI/UX & Argo Experience

**Branch:** `feat/argo-validation`

Anush owns **how OceanX looks and feels**.

## Owns

### Visual design
- layout/composition
- typography
- color system
- spacing
- cards/panels
- loading states
- transitions/micro-interactions

### Controls
- variable selector
- depth slider
- timeline
- Argo/current toggles
- legends

### Argo experience
- Argo details panel
- float metadata
- model-vs-observation chart
- RMSE/mismatch display
- insight/alert card

## Checklist

- [ ] Define the OceanX visual system
- [ ] Design the main 1920×1080 layout
- [ ] Build variable selector
- [ ] Build depth control
- [ ] Build timeline
- [ ] Build layer toggles
- [ ] Build legends
- [ ] Build loading states
- [ ] Build Argo details panel
- [ ] Build ECharts comparison chart
- [ ] Build RMSE/insight card
- [ ] Coordinate marker/select states with KKJ
- [ ] Coordinate state/data needs with Prabhu
- [ ] Coordinate scientific content with Adithya
- [ ] Run final visual polish pass

## Design direction

Aim for:

> **Google Earth + premium scientific control center**

The 3D globe should dominate the screen; the dashboard should support it rather than bury it.

## Definition of done

Every control, chart and panel used in the YouTube recording looks intentional, premium and easy to understand.

---

# Adithya — Demo Data, Scientific Direction & Video

**Branch:** `feat/ocean-data`

## Owns

### Demo data
- Bay of Bengal demo region/time
- temperature layers
- salinity layers
- U/V current data
- prepared depth frames
- prepared time frames
- Argo/example profile data with Anush

### Scientific direction
- units
- realistic ranges
- labels
- terminology
- claims shown on screen
- real vs curated-data documentation

### Video
- recording sequence
- script/voiceover
- captions
- product messaging
- deciding what interactions make the final cut

## Data strategy

Prefer **real publicly available oceanographic data**, then preprocess/downsample it into frontend-friendly JSON.

Recommended structure:

```text
frontend/public/demo-data/
├── ocean/
│   ├── temperature/
│   │   ├── t0-depth-0.json
│   │   ├── t0-depth-50.json
│   │   ├── t0-depth-100.json
│   │   └── ...
│   ├── salinity/
│   └── currents/
├── argo/
│   ├── markers.json
│   └── profiles.json
└── comparison/
    └── argo-001.json
```

Use curated/mock values only where useful for prototype insights or transitions, and do not present invented values as verified live measurements.

## Definition of done

Every scene in the video has scientifically believable data and a clear story.

---

# Prabhu — Frontend State, Data & Interaction Logic

**Branch:** `feat/backend-api`

For this stage, Prabhu does **not** need to build a complete FastAPI backend.

The goal is a clean frontend data abstraction that can read local JSON now and be replaced by API calls later.

## Owns

### Zustand store

Conceptually:

```ts
type OceanState = {
  variable: "temperature" | "salinity" | "currents";
  depth: number;
  timeIndex: number;

  showCurrents: boolean;
  showArgo: boolean;

  selectedArgoId: string | null;
};
```

### Data layer

Target interface:

```ts
getOceanLayer(variable, depth, time)
getCurrents(time)
getArgoFloats()
getComparison(id)
```

### Interaction wiring

- variable selector → correct ocean layer
- depth slider → correct depth frame
- timeline → correct time frame
- toggles → visibility
- marker click → `selectedArgoId`
- selected Argo → details/comparison panel

## Checklist

- [ ] Build Zustand store
- [ ] Define stable TypeScript interfaces
- [ ] Build demo-data loaders
- [ ] Load temperature/salinity frames
- [ ] Load current data
- [ ] Load Argo marker data
- [ ] Load comparison data
- [ ] Connect variable switching
- [ ] Connect depth switching
- [ ] Connect time switching
- [ ] Connect toggles
- [ ] Connect Argo selection
- [ ] Preload important recording frames
- [ ] Keep interaction path working on `develop`

## Definition of done

KKJ's globe and Anush's UI stay synchronized through one predictable state/data layer.

---

# Globe ↔ UI contract

This interface should stay small.

## Shared Zustand state

```text
variable
depth
timeIndex
showArgo
showCurrents
selectedArgoId
```

## Argo marker contract

```ts
interface ArgoMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  status?: "active" | "recent";
}
```

When KKJ's globe marker is clicked:

```text
marker click
    ↓
selectedArgoId changes in Zustand
    ↓
Anush's Argo panel opens
```

No direct dependency between the globe implementation and the details panel is required.

---

# Repository direction

The current repo already contains legacy backend/data folders from the earlier plan. They can remain, but **current submission work should concentrate inside the frontend**.

Target submission structure:

```text
OceanX/
├── frontend/
│   ├── public/
│   │   └── demo-data/          # Adithya
│   │
│   └── src/
│       ├── globe/              # KKJ
│       ├── currents/           # KKJ
│       ├── dashboard/          # Anush
│       ├── controls/           # Anush
│       ├── charts/             # Anush
│       ├── argo/               # Anush
│       ├── state/              # Prabhu
│       ├── data/               # Prabhu
│       └── types/              # Shared contracts
│
├── backend/                    # Post-submission priority
├── ocean_data/                 # Supporting scripts / future pipeline
├── observations/               # Future scientific pipeline
└── analytics/                  # Future analytics pipeline
```

---

# Integrated baseline

At every major checkpoint, `develop` should support:

- [ ] globe opens
- [ ] camera can move/zoom
- [ ] temperature layer appears
- [ ] depth changes work
- [ ] time changes work
- [ ] currents can be enabled
- [ ] Argo markers appear
- [ ] one marker can be selected
- [ ] details/comparison panel opens
- [ ] one insight/alert can be shown

> Feature branches improve the experience; the complete video flow should remain usable on `develop`.

---

# Git workflow

```text
feature branch
      ↓
small commits
      ↓
Pull Request
      ↓
develop
      ↓
recordable integrated build
      ↓
main when stable
```

Useful commit prefixes:

```text
feat(globe):
feat(ui):
feat(state):
feat(data):
feat(argo):
feat(currents):
fix(...):
docs:
chore:
```

---

# Explicitly postponed

Do not spend current submission time on:

- full FastAPI backend
- production NetCDF serving
- Kerchunk / VirtualiZarr
- authentication
- global-scale data access
- real-time streaming
- production Docker/cloud architecture
- full scientific validation engine
- search-and-rescue simulation
- WebGPU migration

These remain part of the full implementation vision after the video prototype.

---

# Submission-stage Definition of Done

- [ ] 1920×1080 layout looks premium
- [ ] opening globe scene is visually impressive
- [ ] temperature/salinity layers look convincing
- [ ] depth control visibly changes the ocean
- [ ] time animation works
- [ ] currents animate smoothly
- [ ] Argo markers appear cleanly
- [ ] marker click opens Argo details
- [ ] model-vs-observation ECharts graph works
- [ ] RMSE/insight is visible
- [ ] data/terminology are scientifically believable
- [ ] no unfinished/debug states appear in the recording path
- [ ] `develop` can be recorded end-to-end
- [ ] final YouTube video is understandable without technical explanation
