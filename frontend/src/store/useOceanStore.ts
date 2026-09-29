/**
 * OceanX Shared Zustand Store
 * Prabhu owns the API; Anush (UI) and KKJ (globe) consume
 * 
 * This is the single source of truth for all ocean view state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { OceanViewState, OceanVariable, CameraState } from '../types';
import type { DemoManifest } from '../types';

interface OceanStore extends OceanViewState {
  manifest: DemoManifest | null;
  depthId: string;
  timeId: string;
  recentArgoIds: string[];
  initializeFromManifest: (manifest: DemoManifest) => void;
  setDepthId: (depthId: string) => void;
  setTimeId: (timeId: string) => void;
  nextTime: () => void;
  previousTime: () => void;
  // Canonical selection writers. Every caller — ProfileSelector, the globe
  // bridge, the Argo panel close button — funnels through these two so a
  // selection change can never leave a stale comparison or spinner behind.
  selectArgo: (id: string | undefined) => void;
  clearSelectedArgo: () => void;
  clearRecentArgo: () => void;
  // Actions
  setVariable: (variable: OceanVariable) => void;
  setDepth: (depth: number) => void;
  setTime: (time: string) => void;
  setBounds: (bounds: OceanViewState['bounds']) => void;
  setShowArgo: (show: boolean) => void;
  setShowCurrents: (show: boolean) => void;
  setSelectedArgoId: (id: string | undefined) => void;

  // Note: comparison data is deliberately not stored here. It is fetched and
  // cached by React Query under ['argoComparison', observationId], so a stale
  // pairing is impossible by construction. This store holds view state only.
  
  // Globe state
  camera: CameraState | null;
  setCamera: (camera: CameraState) => void;
  isGlobeReady: boolean;
  setGlobeReady: (ready: boolean) => void;
  
  // Loading states
  isLoadingOceanSlice: boolean;
  setIsLoadingOceanSlice: (loading: boolean) => void;
  isLoadingArgoProfiles: boolean;
  setIsLoadingArgoProfiles: (loading: boolean) => void;
  
  // Error states
  error: string | null;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

// Default initial state for 1920x1080 recording
const defaultState: OceanViewState = {
  variable: 'temperature',
  depth: 0,
  time: '',
  bounds: {
    north: 20,
    south: 10,
    west: 80,
    east: 92,
  },
  showArgo: true,
  showCurrents: false,
  selectedArgoId: undefined,
};

/**
 * Update selection and maintain a list of up to 3 recently visited Argo floats.
 */
function updateSelectionWithRecents(
  currentSelected: string | undefined,
  currentRecents: string[],
  newSelected: string | undefined
) {
  let nextRecents = [...currentRecents];
  if (currentSelected && currentSelected !== newSelected) {
    nextRecents = [currentSelected, ...nextRecents.filter((id) => id !== currentSelected && id !== newSelected)].slice(0, 3);
  } else if (newSelected) {
    nextRecents = nextRecents.filter((id) => id !== newSelected);
  }

  return {
    selectedArgoId: newSelected,
    recentArgoIds: nextRecents,
    error: null,
  };
}

export const useOceanStore = create<OceanStore>()(
  subscribeWithSelector((set) => ({
    ...defaultState,
    manifest: null,
    depthId: 'depth-0',
    timeId: 't0',
    recentArgoIds: [],
    camera: null,
    isGlobeReady: false,
    isLoadingOceanSlice: false,
    isLoadingArgoProfiles: false,
    error: null,

    // View state actions
    initializeFromManifest: (manifest) => set({
      manifest,
      depthId: manifest.depths[0]?.id ?? 'depth-0',
      depth: manifest.depths[0]?.requestedDepthM ?? 0,
      timeId: manifest.times[0]?.id ?? 't0',
      time: manifest.times[0]?.iso ?? '',
      bounds: { north: manifest.region.north, south: manifest.region.south,
        west: manifest.region.west, east: manifest.region.east },
    }),
    setVariable: (variable) => set({ variable }),
    setDepthId: (depthId) => set((state) => {
      const depth = state.manifest?.depths.find(d => d.id === depthId);
      return depth ? { depthId, depth: depth.requestedDepthM } : {};
    }),
    setTimeId: (timeId) => set((state) => {
      const time = state.manifest?.times.find(t => t.id === timeId);
      return time ? { timeId, time: time.iso } : {};
    }),
    setDepth: (requested) => set((state) => {
      const levels = state.manifest?.depths;
      const depth = levels?.reduce((best, candidate) =>
        Math.abs(candidate.requestedDepthM - requested) < Math.abs(best.requestedDepthM - requested)
          ? candidate : best, levels[0]);
      return depth ? { depth: depth.requestedDepthM, depthId: depth.id } : { depth: requested };
    }),
    setTime: (requested) => set((state) => {
      const time = state.manifest?.times.find(t => t.id === requested || t.iso === requested);
      return time ? { time: time.iso, timeId: time.id } : { time: requested };
    }),
    nextTime: () => set((state) => {
      const times = state.manifest?.times ?? [];
      const next = times[(times.findIndex(t => t.id === state.timeId) + 1) % times.length];
      return next ? { timeId: next.id, time: next.iso } : {};
    }),
    previousTime: () => set((state) => {
      const times = state.manifest?.times ?? [];
      const index = times.findIndex(t => t.id === state.timeId);
      const previous = times[(index - 1 + times.length) % times.length];
      return previous ? { timeId: previous.id, time: previous.iso } : {};
    }),
    setBounds: (bounds) => set({ bounds }),
    setShowArgo: (showArgo) => set({ showArgo }),
    setShowCurrents: (showCurrents) => set({ showCurrents }),
    setSelectedArgoId: (id) => set((state) => updateSelectionWithRecents(state.selectedArgoId, state.recentArgoIds, id || undefined)),
    selectArgo: (id) => set((state) => updateSelectionWithRecents(state.selectedArgoId, state.recentArgoIds, id || undefined)),
    clearSelectedArgo: () => set((state) => updateSelectionWithRecents(state.selectedArgoId, state.recentArgoIds, undefined)),
    clearRecentArgo: () => set({ recentArgoIds: [] }),

    // Globe
    setCamera: (camera) => set({ camera }),
    setGlobeReady: (isGlobeReady) => set({ isGlobeReady }),

    // Loading
    setIsLoadingOceanSlice: (isLoadingOceanSlice) => set({ isLoadingOceanSlice }),
    setIsLoadingArgoProfiles: (isLoadingArgoProfiles) => set({ isLoadingArgoProfiles }),

    // Error
    setError: (error) => set({ error }),

    // Reset to defaults
    reset: () => set((state) => ({ ...defaultState,
      depthId: state.manifest?.depths[0]?.id ?? 'depth-0',
      depth: state.manifest?.depths[0]?.requestedDepthM ?? defaultState.depth,
      timeId: state.manifest?.times[0]?.id ?? 't0',
      time: state.manifest?.times[0]?.iso ?? defaultState.time,
      ...updateSelectionWithRecents(state.selectedArgoId, state.recentArgoIds, undefined),
    })),
  }))
);

// Selectors for common use cases
export const selectVariable = (state: OceanStore) => state.variable;
export const selectDepth = (state: OceanStore) => state.depth;
export const selectTime = (state: OceanStore) => state.time;
export const selectShowArgo = (state: OceanStore) => state.showArgo;
export const selectShowCurrents = (state: OceanStore) => state.showCurrents;
export const selectSelectedArgoId = (state: OceanStore) => state.selectedArgoId;
export const selectRecentArgoIds = (state: OceanStore) => state.recentArgoIds;
export const selectCamera = (state: OceanStore) => state.camera;
export const selectIsGlobeReady = (state: OceanStore) => state.isGlobeReady;
export const selectBounds = (state: OceanStore) => state.bounds;

export default useOceanStore;
