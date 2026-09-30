# Scientific provenance and current availability

## Model

- **Provider/product:** [Copernicus Marine Global Ocean Physics Analysis and Forecast](https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_PHY_001_024/services), product `GLOBAL_ANALYSISFORECAST_PHY_001_024`, version `202406`, DOI `10.48670/moi-00016`.
- **Verified from the Copernicus Marine Toolbox catalogue on 30 September 2026:** `thetao` (`degrees_C`) from `cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m`; `so` (`1e-3`) from `cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m`; `uo` and `vo` (`m s-1`) from `cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m`. Coordinates are `time`, `depth`, `latitude`, `longitude`. The [Toolbox metadata guide](https://help.marine.copernicus.eu/en/articles/8286798-copernicus-marine-toolbox-api-explore-the-catalogue-and-metadata) describes this catalogue inspection.
- **Bounds:** 10–20°N, 80–92°E. No adjustment to the requested box.
- **Downloaded timestamps:** 2025-04-20, 21, 22, and 23 at 00:00 UTC, one daily frame per date.
- **Nearest model depths:** target 0 → 0.494025 m; 50 → 47.373692 m; 100 → 92.326073 m; 150 → 155.850693 m; 200 → 186.125595 m; 500 → 541.088928 m. The generator checks these against downloaded coordinates.
- **Grid and status:** 121 × 145 native cells per frame at 1/12° spacing. Land and missing cells are JSON `null`. The manifest has `assetsReady: true`.

## Observations

The source is the [official Argo GDAC](https://argo.ucsd.edu/data/data-from-gdacs/) at `https://data-argo.ifremer.fr/dac/`, with the [Argo GDAC DOI](https://doi.org/10.17882/42182). The four committed profiles are:

| Profile ID | GDAC file | UTC observation | Max exported depth |
|---|---|---|---:|
| `5907082-059` (featured) | `incois/5907082/profiles/D5907082_059.nc` | 2025-04-20 14:13:45 | 1964.485 m |
| `1902669-059` | `incois/1902669/profiles/D1902669_059.nc` | 2025-04-21 14:16:21 | 2003.988 m |
| `2902766-196` | `csio/2902766/profiles/D2902766_196.nc` | 2025-04-22 11:36:19 | 1959.285 m |
| `7901125-059` | `incois/7901125/profiles/D7901125_059.nc` | 2025-04-22 14:12:48 | 1987.424 m |

The exporter uses only **delayed-mode (`D`) adjusted** `PRES`, `TEMP`, and `PSAL` samples with the corresponding `*_ADJUSTED_QC` flag `1`. Temperature-valid, nonnegative pressure levels are retained; invalid salinity becomes `null`. Pressure in decibar is converted to depth in metres using TEOS-10 `gsw.z_from_p` at the profile latitude. This follows [Argo guidance on adjusted values and QC](https://argo.ucsd.edu/data/how-to-use-argo-files/). Argo temperature is reported in degree Celsius and salinity in psu in the source files. Source URLs and the exact selection rule are included in every exported profile.

## Comparison and prototype wording

Each Argo profile is matched to the nearest daily model time and horizontal grid cell. A model vertical profile is linearly interpolated onto valid observed depths within the overlapping depth range only. `difference = model − observed`; RMSE is the square root of the mean paired squared differences. The insight text reports the largest paired absolute temperature difference and its depth. It makes no causal claim.

The old root-level demo-data assets (`ocean-slices/`, `comparison/`, `argo-profiles.json`, `currents.json`) are legacy mock placeholders. Their values are not cited as scientific data and the new runtime service does not use them. No credentials, raw NetCDF, or GDAC index files are committed.
