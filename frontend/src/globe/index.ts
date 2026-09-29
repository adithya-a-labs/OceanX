/**
 * OceanX 3D Globe - Krishna Kumar Jha's Cesium Implementation
 * Entry point and registration for the Cesium-based 3D visual engine.
 */

import type { InitializeGlobe, GlobeConfig, GlobeInstance } from '../components/globe/types';
import { useOceanStore } from '../store';
import { CesiumGlobe } from './CesiumGlobe';

let activeGlobeInstance: GlobeInstance | null = null;
let storeUnsubscribe: (() => void) | null = null;

export const initializeCesiumGlobe: InitializeGlobe = async (config: GlobeConfig): Promise<GlobeInstance> => {
  // If an active globe instance already exists, dispose it cleanly first
  if (activeGlobeInstance) {
    try {
      activeGlobeInstance.dispose();
    } catch (e) {
      console.warn('[OceanX Globe] Error disposing previous globe instance:', e);
    }
    activeGlobeInstance = null;
  }

  if (storeUnsubscribe) {
    storeUnsubscribe();
    storeUnsubscribe = null;
  }

  // Create new CesiumGlobe instance
  const globe = await CesiumGlobe.create(config);
  activeGlobeInstance = globe;

  // Subscribe to Zustand store to keep 3D layers in real-time sync with UI controls
  storeUnsubscribe = useOceanStore.subscribe((state, prevState) => {
    if (state.variable !== prevState.variable) {
      globe.setVariable(state.variable);
    }
    if (state.depth !== prevState.depth) {
      globe.setDepth(state.depth);
    }
    if (state.time !== prevState.time) {
      globe.setTime(state.time);
    }
    if (state.showArgo !== prevState.showArgo) {
      globe.setShowArgo(state.showArgo);
    }
    if (state.showCurrents !== prevState.showCurrents) {
      globe.setShowCurrents(state.showCurrents);
    }
    if (state.selectedArgoId !== prevState.selectedArgoId) {
      globe.highlightMarker(state.selectedArgoId || '', !!state.selectedArgoId);
    }
  });

  // Wrap dispose to clean up store subscription
  const originalDispose = globe.dispose.bind(globe);
  globe.dispose = () => {
    if (storeUnsubscribe) {
      storeUnsubscribe();
      storeUnsubscribe = null;
    }
    activeGlobeInstance = null;
    originalDispose();
  };

  return globe;
};

// Register on window for App.tsx integration
if (typeof window !== 'undefined') {
  window.__OCEANX_GLOBE_INIT__ = initializeCesiumGlobe;
}

export default initializeCesiumGlobe;
export { CesiumGlobe };
