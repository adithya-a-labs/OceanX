export interface OceanViewState {
  variable: "temperature" | "salinity" | "currents";
  depth: number;
  time: string;
  bounds: { north: number; south: number; east: number; west: number };
  showArgo: boolean;
  showCurrents: boolean;
  selectedObservation?: string;
}
