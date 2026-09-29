/**
 * Argo Selection Hook
 * Manages the Argo marker selection flow between globe (KKJ) and UI (Anush)
 */

import { useCallback, useEffect } from 'react';
import { useOceanStore } from '../store';
import type { ArgoMarker } from '../types';

/**
 * Hook for UI components to manage Argo selection
 */
export function useArgoSelection() {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const argoComparison = useOceanStore((s) => s.argoComparison);
  const isComparisonLoading = useOceanStore((s) => s.isComparisonLoading);
  const setSelectedArgoId = useOceanStore((s) => s.setSelectedArgoId);
  const clearSelectedArgo = useOceanStore((s) => s.clearSelectedArgo);

  const selectArgo = useCallback((marker: ArgoMarker) => {
    setSelectedArgoId(marker.id);
  }, [setSelectedArgoId]);

  const clearSelection = useCallback(() => {
    clearSelectedArgo();
  }, [clearSelectedArgo]);

  return {
    selectedArgoId,
    argoComparison,
    isComparisonLoading,
    selectArgo,
    clearSelection,
    isSelected: !!selectedArgoId,
  };
}

/**
 * Hook for KKJ's globe to register marker click handler
 * This creates the bridge between globe and UI
 */
export function useGlobeBridge() {
  const { selectArgo } = useArgoSelection();

  const handleMarkerClick = useCallback((marker: ArgoMarker) => {
    selectArgo(marker);
  }, [selectArgo]);

  // Read live store state on demand instead of subscribing to a derived object,
  // which would allocate a new snapshot on every store read.
  const getState = useCallback(() => {
    const s = useOceanStore.getState();
    return {
      variable: s.variable,
      depth: s.depth,
      time: s.time,
      showArgo: s.showArgo,
      showCurrents: s.showCurrents,
      selectedArgoId: s.selectedArgoId,
    };
  }, []);

  // Expose to globe via window (KKJ will consume this)
  useEffect(() => {
    window.__OCEANX_GLOBE_BRIDGE__ = { handleMarkerClick, getState };
    return () => {
      delete window.__OCEANX_GLOBE_BRIDGE__;
    };
  }, [handleMarkerClick, getState]);

  return {
    handleMarkerClick,
    getState,
  };
}

/**
 * Hook for globe to sync its state with UI store
 * KKJ can call this to keep globe camera in sync
 */
export function useGlobeSync() {
  const setCamera = useOceanStore((s) => s.setCamera);
  const setGlobeReady = useOceanStore((s) => s.setGlobeReady);

  const updateCamera = useCallback((camera: {
    longitude: number;
    latitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
  }) => {
    setCamera(camera);
  }, [setCamera]);

  const markGlobeReady = useCallback(() => {
    setGlobeReady(true);
  }, [setGlobeReady]);

  return {
    updateCamera,
    markGlobeReady,
  };
}
