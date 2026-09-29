/** Local JSON transport. Components consume these functions and never construct asset paths. */
import type { CurrentField, DemoArgoComparison, DemoArgoMarker, DemoArgoProfile,
  DemoManifest, LayerVariable, OceanLayer } from '../types';

export const demoDataBasePath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/demo-data`;
const cache = new Map<string, Promise<unknown>>();

function fetchJson<T>(path: string): Promise<T> {
  let pending = cache.get(path) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(`${demoDataBasePath}/${path}`).then(async response => {
      if (!response.ok) throw new Error(`OceanX asset ${path}: HTTP ${response.status}`);
      return response.json() as Promise<T>;
    }).catch(error => { cache.delete(path); throw error; });
    cache.set(path, pending);
  }
  return pending;
}

export const loadDemoManifest = () => fetchJson<DemoManifest>('manifest.json');

function requireModel(manifest: DemoManifest) {
  if (!manifest.assetsReady) throw new Error('Model assets await Copernicus authentication and export.');
}

function requireId(id: string, ids: string[], kind: string) {
  if (!ids.includes(id)) throw new Error(`Unknown ${kind}: ${id}`);
}

export async function getOceanLayer(variable: LayerVariable, depthId: string, timeId: string) {
  const manifest = await loadDemoManifest();
  requireModel(manifest);
  if (variable !== 'temperature' && variable !== 'salinity') throw new Error(`Unknown layer: ${variable}`);
  requireId(depthId, manifest.depths.map(d => d.id), 'depth');
  requireId(timeId, manifest.times.map(t => t.id), 'time');
  return fetchJson<OceanLayer>(`ocean/${variable}/${timeId}/${depthId}.json`);
}

export async function getCurrents(timeId: string) {
  const manifest = await loadDemoManifest();
  requireModel(manifest);
  requireId(timeId, manifest.times.map(t => t.id), 'time');
  return fetchJson<CurrentField>(`currents/${timeId}.json`);
}

export const getArgoMarkers = () => fetchJson<DemoArgoMarker[]>('argo/markers.json');

export async function getArgoProfile(id: string) {
  requireId(id, (await loadDemoManifest()).argoIds, 'Argo profile');
  return fetchJson<DemoArgoProfile>(`argo/profiles/${id}.json`);
}

export async function getComparison(id: string) {
  const manifest = await loadDemoManifest();
  requireModel(manifest);
  requireId(id, manifest.argoIds, 'comparison');
  return fetchJson<DemoArgoComparison>(`comparisons/${id}.json`);
}

export function clearDemoDataCache() { cache.clear(); }
