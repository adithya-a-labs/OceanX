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
  assert.equal(manifest.assetsReady, false);
  assert.equal(manifest.times.length, 4);
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
  await assert.rejects(data.getOceanLayer('temperature', 'depth-100', 't1'), /await Copernicus/);
  await assert.rejects(data.getComparison(profile.id), /await Copernicus/);
  const routes = [];
  const readyManifest = { ...manifest, assetsReady: true };
  globalThis.fetch = async url => {
    const pathname = new URL(url, 'http://localhost').pathname;
    routes.push(pathname);
    return { ok: true, json: async () => pathname.endsWith('/manifest.json') ? readyManifest : { pathname } };
  };
  data.clearDemoDataCache();
  useOceanStore.getState().setVariable('salinity');
  assert.equal(useOceanStore.getState().variable, 'salinity');
  const layer = await data.getOceanLayer('salinity', 'depth-200', 't3');
  assert(layer.pathname.endsWith('/ocean/salinity/t3/depth-200.json'));
  await data.getCurrents('t2');
  await data.getComparison(profile.id);
  assert(routes.some(path => path.endsWith('/currents/t2.json')));
  assert(routes.some(path => path.endsWith(`/comparisons/${profile.id}.json`)));
  console.log('Frontend data and state smoke test passed.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
