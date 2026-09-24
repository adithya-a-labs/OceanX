# OceanX 🌊

OceanX is the SIH 2026 MVP for an interactive, browser-based ocean exploration platform — think **Google Earth for the ocean**.

The prototype focuses on the **Bay of Bengal** and lets users explore:
- Temperature
- Salinity
- Ocean currents
- Depth and time
- Real Argo observations
- Model-vs-observation comparison

## Team workflow

This repository is a monorepo. Each team member owns a clearly separated module and works through a dedicated feature branch.

See:
- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/data-contract.md`
- `docs/team-workflow.md`

## MVP principle

Build the end-to-end flow first:

**real model data → API → 3D ocean → depth/time controls → Argo → model vs reality → simple indicator**

Advanced features such as WebGPU, full global coverage, Kerchunk optimization, SAR drift simulation, and additional observation platforms are post-MVP.
