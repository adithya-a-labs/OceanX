/**
 * OceanX Cesium Data Adapter
 * Consumes existing OceanX data layer without modifying Prabhu's implementation.
 * Adapts data for the Cesium 3D visualization engine.
 */

import type { OceanVariable, OceanSlice, ArgoProfile, CurrentsData } from '../types';
import { createDemoDataHelpers, createMockDemoDataHelpers } from '../utils/demoData';

export interface GlobeDataAdapter {
  getOceanSlice: (variable: OceanVariable, depth: number, time: string) => Promise<OceanSlice>;
  getCurrents: (time: string) => Promise<CurrentsData>;
  getArgoProfiles: (variable: OceanVariable, depth: number, time: string) => Promise<ArgoProfile[]>;
}

const BAY_OF_BENGAL_BOUNDS = {
  north: 18,
  south: 12,
  west: 82,
  east: 90,
};

/**
 * Generate scientifically realistic Bay of Bengal ocean grid data
 * when static JSON files are empty or for depth/variable permutations.
 */
function generateBayOfBengalGrid(
  variable: OceanVariable,
  depth: number,
  time: string
): OceanSlice {
  const rows = 96;
  const cols = 96;
  const data: number[][] = [];

  // Depth-dependent temperature profile for Bay of Bengal (warm tropical ocean)
  // Surface: ~29.2°C, 50m: ~27°C, 100m: ~23.5°C (thermocline), 200m: ~17.5°C, 500m: ~11°C
  let baseVal = 29.2;
  let minVal = 27.5;
  let maxVal = 30.5;
  let unit = '°C';
  let colorScale = ['#0ea5e9', '#f97316', '#ef4444'];

  if (variable === 'temperature') {
    if (depth <= 0) {
      baseVal = 29.2; minVal = 27.5; maxVal = 30.8;
    } else if (depth <= 50) {
      baseVal = 27.0; minVal = 25.5; maxVal = 28.5;
    } else if (depth <= 100) {
      baseVal = 23.5; minVal = 21.0; maxVal = 25.2;
    } else if (depth <= 200) {
      baseVal = 17.5; minVal = 15.5; maxVal = 19.5;
    } else {
      baseVal = 11.5; minVal = 9.5; maxVal = 13.5;
    }
  } else if (variable === 'salinity') {
    // Salinity in Bay of Bengal: lower in the north due to Ganga-Brahmaputra river runoff (31.5-33.0 PSU),
    // higher in the south (34.5-35.2 PSU)
    unit = 'PSU';
    colorScale = ['#0ea5e9', '#22d3ee', '#a5f3fc'];
    if (depth <= 0) {
      baseVal = 33.6; minVal = 31.8; maxVal = 35.2;
    } else if (depth <= 50) {
      baseVal = 34.2; minVal = 33.2; maxVal = 35.2;
    } else if (depth <= 100) {
      baseVal = 34.7; minVal = 34.0; maxVal = 35.3;
    } else if (depth <= 200) {
      baseVal = 35.0; minVal = 34.5; maxVal = 35.4;
    } else {
      baseVal = 35.1; minVal = 34.7; maxVal = 35.4;
    }
  }

  const north = BAY_OF_BENGAL_BOUNDS.north;
  const south = BAY_OF_BENGAL_BOUNDS.south;
  const west = BAY_OF_BENGAL_BOUNDS.west;
  const east = BAY_OF_BENGAL_BOUNDS.east;

  for (let r = 0; r < rows; r++) {
    const lat = north - (r / (rows - 1)) * (north - south);
    const rowVals: number[] = [];
    for (let c = 0; c < cols; c++) {
      const lon = west + (c / (cols - 1)) * (east - west);

      // Latitudinal gradient
      const latFraction = (lat - south) / (north - south); // 0 (south) to 1 (north)
      const lonFraction = (lon - west) / (east - west);

      let val = baseVal;

      if (variable === 'temperature') {
        // Slightly warmer in central/southern Bay, cooler near northern coast
        const latEffect = (1 - latFraction) * 0.8 - latFraction * 0.6;
        // Warm core eddy around (86°E, 14.5°N)
        const dLat = (lat - 14.5) / 2.0;
        const dLon = (lon - 86.0) / 2.5;
        const eddy = Math.exp(-(dLat * dLat + dLon * dLon)) * 0.9;
        const wave = Math.sin(lonFraction * 6.0) * 0.3 * Math.cos(latFraction * 4.0);
        val = baseVal + latEffect + eddy + wave;
      } else if (variable === 'salinity') {
        // Northern runoff fresh water plume: low salinity in north, higher in south
        const runoffEffect = (latFraction - 0.5) * -1.8;
        // Coastal freshening along eastern coast
        const coastal = (1 - lonFraction) * 0.3;
        const wave = Math.sin(latFraction * 5.0) * 0.2;
        val = baseVal + runoffEffect + coastal + wave;
      }

      // Clamp between min and max
      val = Math.max(minVal, Math.min(maxVal, val));
      rowVals.push(Number(val.toFixed(2)));
    }
    data.push(rowVals);
  }

  return {
    variable,
    depth,
    time,
    data,
    bounds: BAY_OF_BENGAL_BOUNDS,
    metadata: {
      min: minVal,
      max: maxVal,
      unit,
      colorScale,
    },
  };
}

/**
 * Generate scientifically realistic Bay of Bengal current vector field (u, v)
 * Features the seasonal Bay of Bengal cyclonic/anticyclonic gyre circulation.
 */
function generateBayOfBengalCurrents(time: string): CurrentsData {
  const rows = 40;
  const cols = 40;
  const u: number[][] = [];
  const v: number[][] = [];

  const north = BAY_OF_BENGAL_BOUNDS.north;
  const south = BAY_OF_BENGAL_BOUNDS.south;
  const west = BAY_OF_BENGAL_BOUNDS.west;
  const east = BAY_OF_BENGAL_BOUNDS.east;

  const centerLon = (west + east) / 2; // 86°E
  const centerLat = (north + south) / 2; // 15°N

  for (let r = 0; r < rows; r++) {
    const lat = north - (r / (rows - 1)) * (north - south);
    const uRow: number[] = [];
    const vRow: number[] = [];

    for (let c = 0; c < cols; c++) {
      const lon = west + (c / (cols - 1)) * (east - west);

      // Normalized coordinates relative to central gyre
      const dx = (lon - centerLon) / 3.5;
      const dy = (lat - centerLat) / 2.5;
      const radius = Math.hypot(dx, dy);

      // Clockwise gyre in the Bay of Bengal
      // u = dy * speedFactor, v = -dx * speedFactor
      const gyreStrength = Math.exp(-Math.pow(radius - 0.7, 2) / 0.5) * 0.45;
      let uVal = dy * gyreStrength;
      let vVal = -dx * gyreStrength;

      // Western boundary current: strong northward flow along East Coast of India (lon 82°-84°)
      if (lon < 84.5) {
        const westernIntensification = (1 - (lon - west) / 2.5) * 0.25;
        vVal += westernIntensification;
      }

      // Add gentle meanders
      uVal += Math.sin(lat * 0.8) * 0.08;
      vVal += Math.cos(lon * 0.8) * 0.08;

      uRow.push(Number(uVal.toFixed(3)));
      vRow.push(Number(vVal.toFixed(3)));
    }
    u.push(uRow);
    v.push(vRow);
  }

  return {
    time,
    u,
    v,
    bounds: BAY_OF_BENGAL_BOUNDS,
  };
}

export function createGlobeDataAdapter(basePath: string = '/demo-data'): GlobeDataAdapter {
  const fileHelpers = createDemoDataHelpers(basePath);
  const mockHelpers = createMockDemoDataHelpers();

  return {
    async getOceanSlice(variable: OceanVariable, depth: number, time: string): Promise<OceanSlice> {
      try {
        // Attempt to fetch from static demo files first
        const slice = await fileHelpers.getOceanSlice(variable, depth, time);
        if (slice && Array.isArray(slice.data) && slice.data.length > 0 && slice.data[0]?.length > 0) {
          return slice;
        }
      } catch {
        // Static file not found or network error, fallback to mock helper or generator
      }

      try {
        const mock = await mockHelpers.getOceanSlice(variable, depth, time);
        if (mock && Array.isArray(mock.data) && mock.data.length > 0) {
          // If mock data is present, refine metadata for depth
          return generateBayOfBengalGrid(variable, depth, time);
        }
      } catch {
        // Fall through
      }

      return generateBayOfBengalGrid(variable, depth, time);
    },

    async getCurrents(time: string): Promise<CurrentsData> {
      try {
        const currents = await fileHelpers.getCurrents(time);
        if (currents && Array.isArray(currents.u) && currents.u.length > 0) {
          return currents;
        }
      } catch {
        // Fall through
      }

      return generateBayOfBengalCurrents(time);
    },

    async getArgoProfiles(variable: OceanVariable, depth: number, time: string): Promise<ArgoProfile[]> {
      try {
        const profiles = await fileHelpers.getArgoProfiles(variable, depth, time);
        if (profiles && profiles.length > 0) {
          return profiles;
        }
      } catch {
        // Fall through
      }

      return mockHelpers.getArgoProfiles(variable, depth, time);
    },
  };
}
