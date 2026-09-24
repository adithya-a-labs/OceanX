export interface OceanSlice {
  variable: string;
  unit: string;
  time: string;
  depth: number;
  bounds: { north: number; south: number; east: number; west: number };
  latitudes: number[];
  longitudes: number[];
  values: number[] | number[][];
}
