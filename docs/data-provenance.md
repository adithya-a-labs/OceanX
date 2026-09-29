# Scientific provenance and current availability

## Model

- **Provider/product:** [Copernicus Marine Global Ocean Physics Reanalysis](https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/services), product `GLOBAL_MULTIYEAR_PHY_001_030`, daily dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m`, version `202311`, DOI `10.48670/moi-00021`.
- **Verified from the Copernicus Marine Toolbox catalogue on 29 September 2026:** `thetao` = sea water potential temperature (`degrees_C`); `so` = sea water salinity (`1e-3`); `uo` = eastward sea water velocity (`m s-1`); `vo` = northward sea water velocity (`m s-1`). Catalogue coordinates are `time`, `depth`, `latitude`, `longitude`; latitude and longitude are degrees north/east and depth is metres. The [Toolbox metadata guide](https://help.marine.copernicus.eu/en/articles/8286798-copernicus-marine-toolbox-api-explore-the-catalogue-and-metadata) describes this catalogue inspection.
- **Bounds:** 10–20°N, 80–92°E. No adjustment to the requested box.
- **Planned recording dates:** 2025-04-20 through 2025-04-23, one daily frame per date. Actual ISO timestamps are **pending subset download**; they must not be described as hourly or as observed output yet.
- **Catalogue-verified nearest model depths:** target surface → 0.494025 m; 50 → 47.373692 m; 100 → 92.326073 m; 200 → 186.125595 m; 500 → 541.088928 m. The generator checks these against the downloaded coordinate values before writing layers.
- **Current model status:** no model scientific values have been exported. The Copernicus Toolbox credential check reported no credentials. `manifest.json` keeps `assetsReady: false`, and model requests reject. The [Toolbox authentication guide](https://help.marine.copernicus.eu/en/articles/8185007-copernicus-marine-toolbox-credentials-configuration) and [environment variable guide](https://help.marine.copernicus.eu/en/articles/8630590-copernicus-marine-toolbox-faq) document login options.

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

When model access is available, each Argo profile is matched to the nearest daily model time and horizontal grid cell. A full model vertical profile is linearly interpolated onto valid observed depths within the overlapping depth range only. `difference = model − observed`; RMSE is the square root of the mean paired squared differences. The insight text reports the largest paired absolute temperature difference and its depth. It makes no causal claim. No comparison, RMSE, or insight has been published in the current pending-model package.

The old root-level demo-data assets (`ocean-slices/`, `comparison/`, `argo-profiles.json`, `currents.json`) are legacy mock placeholders. Their values are not cited as scientific data and the new runtime service does not use them. No credentials, raw NetCDF, or GDAC index files are committed.
