/**
 * OceanX Shared Zustand Store
 * Prabhu owns the API; Anush (UI) and KKJ (globe) consume
 * 
 * This is the single source of truth for all ocean view state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { OceanViewState, OceanVariable, ArgoComparison, CameraState } from '../types';

interface OceanStore extends OceanViewState {
  // Actions
  setVariable: (variable: OceanVariable) => void;
  setDepth: (depth: number) => void;
  setTime: (time: string) => void;
  setBounds: (bounds: OceanViewState['bounds']) => void;
  setShowArgo: (show: boolean) => void;
  setShowCurrents: (show: boolean) => void;
  setSelectedArgoId: (id: string | undefined) => void;
  
  // Argo comparison state
  argoComparison: ArgoComparison | null;
  setArgoComparison: (comparison: ArgoComparison | null) => void;
  isComparisonLoading: boolean;
  setIsComparisonLoading: (loading: boolean) => void;
  
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
  time: '2026-09-24T12:00:00Z',
  bounds: {
    north: 18,
    south: 12,
    west: 82,
    east: 90,
  },
  showArgo: true,
  showCurrents: false,
  selectedArgoId: undefined,
};

export const useOceanStore = create<OceanStore>()(
  subscribeWithSelector((set) => ({
    ...defaultState,
    argoComparison: null,
    isComparisonLoading: false,
    camera: null,
    isGlobeReady: false,
    isLoadingOceanSlice: false,
    isLoadingArgoProfiles: false,
    error: null,

    // View state actions
    setVariable: (variable) => set({ variable }),
    setDepth: (depth) => set({ depth }),
    setTime: (time) => set({ time }),
    setBounds: (bounds) => set({ bounds }),
    setShowArgo: (showArgo) => set({ showArgo }),
    setShowCurrents: (showCurrents) => set({ showCurrents }),
    setSelectedArgoId: (selectedArgoId) => set({ selectedArgoId }),

    // Argo comparison
    setArgoComparison: (argoComparison) => set({ argoComparison }),
    setIsComparisonLoading: (isComparisonLoading) => set({ isComparisonLoading }),

    // Globe
    setCamera: (camera) => set({ camera }),
    setGlobeReady: (isGlobeReady) => set({ isGlobeReady }),

    // Loading
    setIsLoadingOceanSlice: (isLoadingOceanSlice) => set({ isLoadingOceanSlice }),
    setIsLoadingArgoProfiles: (isLoadingArgoProfiles) => set({ isLoadingArgoProfiles }),

    // Error
    setError: (error) => set({ error }),

    // Reset to defaults
    reset: () => set(defaultState),
  }))
);

// Selectors for common use cases
export const selectVariable = (state: OceanStore) => state.variable;
export const selectDepth = (state: OceanStore) => state.depth;
export const selectTime = (state: OceanStore) => state.time;
export const selectShowArgo = (state: OceanStore) => state.showArgo;
export const selectShowCurrents = (state: OceanStore) => state.showCurrents;
export const selectSelectedArgoId = (state: OceanStore) => state.selectedArgoId;
export const selectArgoComparison = (state: OceanStore) => state.argoComparison;
export const selectIsComparisonLoading = (state: OceanStore) => state.isComparisonLoading;
export const selectCamera = (state: OceanStore) => state.camera;
export const selectIsGlobeReady = (state: OceanStore) => state.isGlobeReady;
export const selectBounds = (state: OceanStore) => state.bounds;

export default useOceanStore;