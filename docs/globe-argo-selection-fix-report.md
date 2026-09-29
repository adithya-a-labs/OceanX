# Globe Argo Selection Fix — Project Report

**Date:** 2026-09-29
**Branch:** `feat/argo-validation`
**Scope:** Fix "click a point on the globe, no data shows" and report the work.

---

## 1. Summary

Clicking an Argo float marker on the 3D globe selected a float id that the
details panel could not resolve, so the panel opened empty (error state) instead
of showing the profile. The cause was a **data-source mismatch**: the globe
rendered synthetic demo floats (`argo_demo_001`…`argo_demo_005`) while the panel
resolved observations against the **real** Argo dataset (`5907082-059`,
`1902669-059`, `2902766-196`, `7901125-059`).

The fix routes the globe's Argo markers through the same real data pipeline the
dashboard already uses, so the clicked marker id matches a loadable profile. The
issue is fixed and verified end-to-end in a live browser.

---

## 2. Symptom

- Clicking an Argo marker rendered on the globe opened the "Argo Float Details"
  panel with **no profile data**.
- The float list (left control panel) and the globe markers did **not** agree on
  which floats existed.

---

## 3. Root Cause

Two independent Argo data paths existed in the frontend.

| Path | Source | Float ids | Used by |
|------|--------|-----------|---------|
| Synthetic | `public/demo-data/argo-profiles.json` | `argo_demo_001`…`argo_demo_005` | Globe markers (before fix) |
| Real | `public/demo-data/argo/markers.json` + `argo/profiles/*.json` | `5907082-059`, `1902669-059`, `2902766-196`, `7901125-059` | Dashboard list, details panel |

**Click chain (before fix):**

1. `ArgoMarkerRenderer` picks the clicked entity and emits the marker id
   — `frontend/src/globe/ArgoMarkerRenderer.ts:107-121`.
2. The id is a synthetic `argo_demo_*` id, because the globe obtained its
   profiles via `createDemoDataHelpers(...).getArgoProfiles(...)`, which fetches
   `/demo-data/argo-profiles.json` — `frontend/src/utils/demoData.ts:40-48`,
   wired at `frontend/src/globe/dataAdapter.ts:235-246`.
3. Selection is stored as `selectedArgoId = 'argo_demo_001'`
   (`frontend/src/App.tsx:131`).
4. `ArgoPanel` calls `getArgoProfile('argo_demo_001')`
   — `frontend/src/components/panels/ArgoPanel.tsx:41`.
5. `getArgoProfile` validates the id against `manifest.argoIds` and throws
   `Unknown Argo profile: argo_demo_001` — `frontend/src/data/demoData.ts:48-51`.
6. The panel renders its error/empty state → **no data showing**.

The dashboard list worked because it already used the real pipeline via the
React Query helpers registered in `frontend/src/App.tsx:13`
(`demoDataHelpers` from `frontend/src/data/legacyAdapter.ts`).

---

## 4. Fix

**File:** `frontend/src/globe/dataAdapter.ts`

Make the globe's Argo source use the same real pipeline as the dashboard
(`realDataHelpers`, i.e. `demoDataHelpers` from `src/data/legacyAdapter.ts`),
which correctly maps real markers/profiles into the globe's `ArgoProfile`
shape and yields real ids.

```diff
 import type { OceanVariable, OceanSlice, ArgoProfile, CurrentsData } from '../types';
 import { createDemoDataHelpers, createMockDemoDataHelpers } from '../utils/demoData';
+import { demoDataHelpers as realDataHelpers } from '../data/legacyAdapter';
...
     async getArgoProfiles(variable: OceanVariable, depth: number, time: string): Promise<ArgoProfile[]> {
+      // Use the same real Argo pipeline as the dashboard so marker ids match
+      // the ids the details panel resolves against. The synthetic
+      // argo-profiles.json uses argo_demo_* ids and would desync selection.
       try {
-        const profiles = await fileHelpers.getArgoProfiles(variable, depth, time);
+        const profiles = await realDataHelpers.getArgoProfiles(variable, depth, time);
         if (profiles && profiles.length > 0) {
           return profiles;
         }
       } catch {
-        // Fall through
+        // Fall through to mock only when the real dataset is unavailable.
       }
 
       return mockHelpers.getArgoProfiles(variable, depth, time);
```

The real path reads `argo/markers.json` (filtered by `hasTemperature` /
`hasSalinity`) and maps each profile's `depthM` / `temperatureDegC` / `salinity`
into the globe's `ArgoProfile` (`frontend/src/data/legacyAdapter.ts:30-37`). Argo
profiles load independently of `manifest.assetsReady`, so no model assets are
required.

---

## 5. Verification

### 5.1 Static gates

| Gate | Command | Result |
|------|---------|--------|
| Types | `npm run typecheck` | Pass |
| Lint | `npm run lint` | Pass |
| Data/state smoke | `npm run test:data` | `Frontend data and state smoke test passed.` |

### 5.2 Live browser (Vite dev server)

- The globe adapter now returns **real** ids with full profiles:

  | id | levels | first T (°C) |
  |----|--------|--------------|
  | `5907082-059` | 102 | 29.596 |
  | `1902669-059` | 104 | 30.112 |
  | `2902766-196` | 102 | 30.852 |
  | `7901125-059` | 98 | 30.521 |

- A **real canvas click** on the projected marker position selected
  `selectedArgoId = "5907082-059"`.
- The panel then rendered the profile: "Argo Float Details",
  "Observed profile", `"Argo Temperature profile against depth, 102 valid levels"`,
  and provenance
  "OBSERVATION — Argo Float 5907082-059 · Argo GDAC · Delayed-mode adjusted PRES/TEMP/PSAL, each with adjusted QC flag 1".
- No "Could not load" / "no data" state present.
- Console: **0 errors, 0 warnings**.
- Network: `argo/markers.json` and the four `argo/profiles/*.json` files fetched;
  the synthetic `argo-profiles.json` is no longer requested.

---

## 6. Impact and Files

**Changed (this fix):**

- `frontend/src/globe/dataAdapter.ts` — globe Argo source switched to the real pipeline.

**Related, unchanged:** `frontend/src/data/legacyAdapter.ts`,
`frontend/src/data/demoData.ts`, `frontend/src/utils/demoData.ts`,
`frontend/src/components/panels/ArgoPanel.tsx`,
`frontend/src/globe/ArgoMarkerRenderer.ts`.

The change is additive and low-risk: ocean-field and currents behavior are
untouched, and the mock helper remains only as a last-resort fallback.

---

## 7. Remaining / Known Limitations

- **Model layers and model-vs-Argo comparison** remain gated by
  `manifest.assetsReady = false`; comparison runtime states cannot be exercised
  until real Copernicus exports exist.
- **Hover tooltip** on markers is not implemented (hover only changes cursor and
  marker styling); the click flow is what this fix addresses.
- `public/demo-data/argo-profiles.json` and the synthetic `argo_demo_*`
  comparison files are now unused by the globe and are candidates for removal
  once the real pipeline is finalized.
- Frontend gates (`typecheck`, `lint`, `build`, `test:data`) pass; the production
  build retains the pre-existing large-bundle warning (~6.54 MB JS chunk)
  unrelated to this fix.

---

## 8. How to Reproduce the Verification

```bash
cd frontend
npm run dev            # http://localhost:5173
```

1. Wait for the globe to load and fly to the Bay of Bengal.
2. Click any Argo marker (e.g. `5907082-059`).
3. The details panel opens and shows the observed temperature profile with
   provenance — no empty/error state.
