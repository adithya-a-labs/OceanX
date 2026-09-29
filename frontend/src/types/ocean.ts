/**
 * OceanX Shared Types
 * Used by frontend, backend (Prabhu), and globe (KKJ)
 */

export type OceanVariable = 'temperature' | 'salinity' | 'currents';

export interface OceanViewState {
  variable: OceanVariable;
  depth: number;
  time: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  showArgo: boolean;
  showCurrents: boolean;
  selectedArgoId?: string;
}

export interface OceanSlice {
  variable: OceanVariable;
  depth: number;
  time: string;
  data: (number | null)[][];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  metadata: {
    min: number;
    max: number;
    unit: string;
    colorScale: string[];
  };
}

export interface CurrentsData {
  time: string;
  u: (number | null)[][]; // Eastward velocity
  v: (number | null)[][]; // Northward velocity
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

// Globe events are defined in globe/types.ts to avoid duplication
// export interface GlobeEvents { ... }

export interface ArgoMarker {
  id: string;
  latitude: number;
  longitude: number;
}

export interface ArgoProfile {
  id: string;
  latitude: number;
  longitude: number;
  time: string;
  depth: number[];
  temperature: number[];
  salinity: (number | null)[];
}

export interface ArgoComparison {
  id: string;
  latitude: number;
  longitude: number;
  time: string;
  variable: OceanVariable;
  depth: number[];
  observed: number[];
  model: number[];
  difference: number[];
  rmse: number;
  /** Curated insight text from the dataset author; shown verbatim when present. */
  insight?: string;
}

export interface InsightData {
  id: string;
  observationId: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  };
}

// ECharts animation easing types
export type AnimationEasing = 
  | 'linear'
  | 'quadraticIn' | 'quadraticOut' | 'quadraticInOut'
  | 'cubicIn' | 'cubicOut' | 'cubicInOut'
  | 'quarticIn' | 'quarticOut' | 'quarticInOut'
  | 'quinticIn' | 'quinticOut' | 'quinticInOut'
  | 'sinusoidalIn' | 'sinusoidalOut' | 'sinusoidalInOut'
  | 'exponentialIn' | 'exponentialOut' | 'exponentialInOut'
  | 'circularIn' | 'circularOut' | 'circularInOut'
  | 'elasticIn' | 'elasticOut' | 'elasticInOut'
  | 'backIn' | 'backOut' | 'backInOut'
  | 'bounceIn' | 'bounceOut' | 'bounceInOut';
