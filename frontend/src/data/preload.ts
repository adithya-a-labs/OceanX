import type { DemoManifest, LayerVariable } from '../types';
import { getOceanLayer, getCurrents, getArgoMarkers, getComparison } from './demoData';

/** Warm the frames adjacent to the current recording selection. */
export async function preloadNearbyFrames(manifest: DemoManifest, variable: LayerVariable,
  depthId: string, timeId: string): Promise<void> {
  if (!manifest.assetsReady) return;
  const di = manifest.depths.findIndex(d => d.id === depthId);
  const ti = manifest.times.findIndex(t => t.id === timeId);
  if (di < 0 || ti < 0) return;
  const requests: Promise<unknown>[] = [getOceanLayer(variable, depthId, timeId)];
  for (const index of [ti - 1, ti + 1]) {
    if (manifest.times[index]) requests.push(getOceanLayer(variable, depthId, manifest.times[index].id));
  }
  for (const index of [di - 1, di + 1]) {
    if (manifest.depths[index]) requests.push(getOceanLayer(variable, manifest.depths[index].id, timeId));
  }
  requests.push(getCurrents(timeId), getArgoMarkers(), getComparison(manifest.featuredArgoId));
  await Promise.allSettled(requests);
}
