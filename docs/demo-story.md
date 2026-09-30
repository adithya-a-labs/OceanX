# OceanX recording path

`frontend/public/demo-data/demo-sequence.json` pins the following path. It now has `ready: true`, matching the manifest's `assetsReady: true`.

1. **Hero globe:** open OceanX with the Bay of Bengal in view.
2. **Bay zoom:** focus 10–20°N, 80–92°E.
3. **Temperature:** show the first actual daily field (`t0`).
4. **Depth:** move from surface through approximately 50, 100, 150, 200 and 500 m; show the actual model depth when a target is selected.
5. **Time:** step through `t0`–`t3` with the dates from the generated manifest.
6. **Currents:** enable the surface U/V overlay and animate arrows or particles.
7. **Argo:** enable real observation markers.
8. **Selection:** choose featured profile `5907082-059` and show its adjusted, QC 1 observation values.
9. **Comparison:** show the matched model and observation temperature profile and RMSE.
10. **Insight:** report the largest paired temperature difference and its depth, using the generated comparison data.
11. **Final hero:** return to the broad ocean view.

The current checkout supports the real Argo observation selection. The model-dependent scenes, comparisons and insight remain pending Copernicus authentication and export.
