/** Adapts the shared demo-data loader to the globe's north-first grid convention. */
import type { OceanVariable, OceanSlice, ArgoProfile, CurrentsData } from '../types';
import { demoDataHelpers } from '../data/legacyAdapter';

export interface GlobeDataAdapter {
  getOceanSlice: (variable: OceanVariable, depth: number, time: string) => Promise<OceanSlice>;
  getCurrents: (time: string) => Promise<CurrentsData>;
  getArgoProfiles: (variable: OceanVariable, depth: number, time: string) => Promise<ArgoProfile[]>;
}

export function createGlobeDataAdapter(_basePath: string = '/demo-data'): GlobeDataAdapter {
  return {
    async getOceanSlice(variable, depth, time) {
      const slice = await demoDataHelpers.getOceanSlice(variable, depth, time);
      return { ...slice, data: [...slice.data].reverse() };
    },
    async getCurrents(time) {
      const field = await demoDataHelpers.getCurrents(time);
      return { ...field, u: [...field.u].reverse(), v: [...field.v].reverse() };
    },
    getArgoProfiles: demoDataHelpers.getArgoProfiles,
  };
}
