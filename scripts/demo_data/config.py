"""Pinned scientific sources and the deterministic recording window."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "frontend" / "public" / "demo-data"
PRODUCT_ID = "GLOBAL_ANALYSISFORECAST_PHY_001_024"
DATASET_IDS = {
    "temperature": "cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m",
    "salinity": "cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m",
    "currents": "cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m",
}
DATASET_ID = DATASET_IDS["temperature"]  # Existing single-ID manifest field.
REGION = {"name": "Bay of Bengal", "south": 10, "north": 20, "west": 80, "east": 92}
DATES = ("2025-04-20", "2025-04-21", "2025-04-22", "2025-04-23")
REQUESTED_DEPTHS = (0, 50, 100, 150, 200, 500)
VARIABLE_STANDARDS = {
    "temperature": "sea_water_potential_temperature",
    "salinity": "sea_water_salinity",
    "u": "eastward_sea_water_velocity",
    "v": "northward_sea_water_velocity",
}
PROFILE_PATHS = (
    "incois/5907082/profiles/D5907082_059.nc",
    "incois/1902669/profiles/D1902669_059.nc",
    "csio/2902766/profiles/D2902766_196.nc",
    "incois/7901125/profiles/D7901125_059.nc",
)
FEATURED_ID = "5907082-059"
GDAC_BASE = "https://data-argo.ifremer.fr/dac/"
GDAC_INDEX = "https://data-argo.ifremer.fr/ar_index_global_prof.txt.gz"
