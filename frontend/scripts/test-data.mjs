import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  const pathname = new URL(url, 'http://localhost').pathname;
  const path = resolve(process.cwd(), 'public', pathname.replace(/^\//, ''));
  try {
    const body = await readFile(path, 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404 };
  }
};

try {
  const data = await server.ssrLoadModule('/src/data/demoData.ts');
  const { useOceanStore } = await server.ssrLoadModule('/src/store/useOceanStore.ts');
  const manifest = await data.loadDemoManifest();
  assert.equal(manifest.assetsReady, true);
  assert.equal(manifest.times.length, 4);
  assert.equal(manifest.depths.length, 6);
  const store = useOceanStore.getState();
  store.initializeFromManifest(manifest);
  assert.equal(useOceanStore.getState().timeId, manifest.times[0].id);
  assert.equal(useOceanStore.getState().depthId, manifest.depths[0].id);
  useOceanStore.getState().setDepth(96);
  assert.equal(useOceanStore.getState().depthId, 'depth-100');
  useOceanStore.getState().setTimeId('t2');
  assert.equal(useOceanStore.getState().time, manifest.times[2].iso);
  useOceanStore.getState().previousTime();
  assert.equal(useOceanStore.getState().timeId, 't1');
  useOceanStore.getState().selectArgo(manifest.featuredArgoId);
  assert.equal(useOceanStore.getState().selectedArgoId, manifest.featuredArgoId);
  const markers = await data.getArgoMarkers();
  const profile = await data.getArgoProfile(manifest.featuredArgoId);
  assert(markers.some(m => m.id === profile.id && m.featured));
  assert(profile.depthM.at(-1) >= 500);
  const temperature = await data.getOceanLayer('temperature', 'depth-100', 't1');
  assert.equal(temperature.meta.time, manifest.times[1].iso);
  assert.equal(temperature.meta.actualDepthM, manifest.depths[2].actualDepthM);
  assert.equal(temperature.values.length, temperature.latitudes.length);
  assert.equal(temperature.values[0].length, temperature.longitudes.length);
  assert(temperature.meta.rows * temperature.meta.columns > 10000);
  useOceanStore.getState().setVariable('salinity');
  assert.equal(useOceanStore.getState().variable, 'salinity');
  const salinity = await data.getOceanLayer('salinity', 'depth-200', 't3');
  assert.equal(salinity.meta.time, manifest.times[3].iso);
  assert.equal(salinity.meta.variable, 'salinity');
  const currents = await data.getCurrents('t2');
  assert.equal(currents.meta.time, manifest.times[2].iso);
  assert.equal(currents.u.length, currents.latitudes.length);
  const comparison = await data.getComparison(profile.id);
  assert.equal(comparison.observationId, profile.id);
  console.log('Frontend data and state smoke test passed.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
