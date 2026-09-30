/** Adapter for the current dashboard contract while its components migrate to typed grids. */
import type { ArgoComparison, ArgoProfile, CurrentsData, OceanSlice, OceanVariable } from '../types';
import { getArgoMarkers, getArgoProfile, getComparison, getCurrents, getOceanLayer,
  loadDemoManifest } from './demoData';

async function ids(depth: number, time: string) {
  const manifest = await loadDemoManifest();
  const selectedDepth = manifest.depths.reduce((best, item) =>
    Math.abs(item.requestedDepthM - depth) < Math.abs(best.requestedDepthM - depth) ? item : best,
  manifest.depths[0]);
  const selectedTime = manifest.times.find(item => item.id === time || item.iso === time)
    ?? (time === '' ? manifest.times[0] : undefined);
  if (!selectedDepth || !selectedTime) throw new Error('Unknown demo frame');
  return { depthId: selectedDepth.id, timeId: selectedTime.id };
}

export const demoDataHelpers = {
  async getOceanSlice(variable: OceanVariable, depth: number, time: string): Promise<OceanSlice> {
    if (variable === 'currents') throw new Error('Currents use getCurrents');
    const { depthId, timeId } = await ids(depth, time);
    const layer = await getOceanLayer(variable, depthId, timeId);
    return {
      variable, depth: layer.meta.actualDepthM, time: layer.meta.time,
      data: layer.values,
      bounds: { north: Math.max(...layer.latitudes), south: Math.min(...layer.latitudes),
        east: Math.max(...layer.longitudes), west: Math.min(...layer.longitudes) },
      metadata: { min: layer.meta.min, max: layer.meta.max, unit: layer.meta.unit,
        colorScale: [] },
    };
  },
  async getArgoProfiles(variable: OceanVariable, _depth: number, _time: string): Promise<ArgoProfile[]> {
    if (variable === 'currents') return [];
    const markers = (await getArgoMarkers()).filter(m =>
      variable === 'temperature' ? m.hasTemperature : m.hasSalinity);
    const profiles = await Promise.all(markers.map(m => getArgoProfile(m.id)));
    return profiles.map(p => ({ id: p.id, latitude: p.latitude, longitude: p.longitude,
      time: p.time, depth: p.depthM, temperature: p.temperatureDegC, salinity: p.salinity }));
  },
  async getComparison(id: string): Promise<ArgoComparison> {
    const comparison = await getComparison(id);
    return {
      id, latitude: comparison.match.observationLatitude,
      longitude: comparison.match.observationLongitude,
      time: comparison.match.observationTime, variable: comparison.variable,
      depth: comparison.depthM, observed: comparison.observed, model: comparison.model,
      difference: comparison.difference, rmse: comparison.rmse, insight: comparison.insight,
    };
  },
  async getCurrents(time: string): Promise<CurrentsData> {
    const { timeId } = await ids(0, time);
    const field = await getCurrents(timeId);
    return { time: field.meta.time, u: field.u, v: field.v,
      bounds: { north: Math.max(...field.latitudes), south: Math.min(...field.latitudes),
        east: Math.max(...field.longitudes), west: Math.min(...field.longitudes) } };
  },
};
