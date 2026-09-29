import type { OceanVariable } from './ocean';

export type LayerVariable = Extract<OceanVariable, 'temperature' | 'salinity'>;
export interface DemoManifest {
  version: number;
  assetsReady: boolean;
  region: { name: string; south: number; north: number; west: number; east: number };
  model: { provider: string; productId: string; datasetId: string; datasetVersion: string; doi: string };
  plannedDates: string[];
  times: { id: string; iso: string; status?: 'planned' }[];
  depths: { id: string; requestedDepthM: number; actualDepthM: number }[];
  variables: Record<'temperature' | 'salinity' | 'u' | 'v', {
    sourceVariable: string; unit: string; standardName: string;
  }>;
  featuredArgoId: string;
  argoIds: string[];
  provenance: { model: string; argo: string; insightText: string };
}

export interface OceanLayer {
  meta: { variable: LayerVariable; unit: string; time: string; requestedDepthM: number;
    actualDepthM: number; source: string; datasetId: string; min: number; max: number;
    rows: number; columns: number };
  latitudes: number[];
  longitudes: number[];
  values: (number | null)[][];
}

export interface CurrentField {
  meta: { time: string; actualDepthM: number; unit: string; source: string;
    datasetId: string; rows: number; columns: number };
  latitudes: number[];
  longitudes: number[];
  u: (number | null)[][];
  v: (number | null)[][];
  speed: (number | null)[][];
}

export interface DemoArgoMarker {
  id: string; platformId: string; cycle: number; latitude: number; longitude: number;
  time: string; maxDepthM: number; hasTemperature: boolean; hasSalinity: boolean;
  featured: boolean;
}

export interface DemoArgoProfile {
  id: string; platformId: string; cycle: number; latitude: number; longitude: number;
  time: string; source: { provider: string; profileFile: string; dataMode: string };
  depthM: number[]; temperatureDegC: number[]; salinity: (number | null)[];
  quality: { method: string; notes: string };
}

export interface DemoArgoComparison {
  observationId: string; variable: LayerVariable; unit: string; depthM: number[];
  observed: number[]; model: number[]; difference: number[]; rmse: number;
  match: { observationTime: string; modelTime: string;
    observationLatitude: number; observationLongitude: number;
    modelLatitude: number; modelLongitude: number;
    spaceMethod: 'nearest'; timeMethod: 'nearest'; depthMethod: 'linear-interpolation';
    modelDepthRangeM: [number, number] };
  insight?: string;
}
