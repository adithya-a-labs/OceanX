export interface ObservationComparison {
  id: string;
  latitude: number;
  longitude: number;
  time: string;
  variable: string;
  depth: number[];
  observed: number[];
  model: number[];
  difference: number[];
  rmse: number;
}
