import { useEffect, useCallback } from 'react';
import { useOceanStore } from './store';
import { MainLayout } from './components/layout';
import { useGlobeBridge, useGlobeSync } from './hooks/useArgoSelection';
import { createMockDemoDataHelpers } from './utils/demoData';
import { setDemoDataHelpers } from './hooks/useOceanData';
import './globe';
import type { OceanVariable, InitializeGlobe, GlobeInstance, ArgoMarker } from './types';

// Extend Window type for globe integration
declare global {
  interface Window {
    __OCEANX_GLOBE_INIT__?: InitializeGlobe;
    __OCEANX_GLOBE_INSTANCE__?: GlobeInstance;
    __OCEANX_GLOBE_BRIDGE__?: {
      handleMarkerClick: (marker: ArgoMarker) => void;
      getState: () => {
        variable: OceanVariable;
        depth: number;
        time: string;
        showArgo: boolean;
        showCurrents: boolean;
        selectedArgoId: string | undefined;
      };
    } | undefined;
  }
}

function OceanXApp() {
  const setGlobeReady = useOceanStore((s) => s.setGlobeReady);
  const setIsLoadingOceanSlice = useOceanStore((s) => s.setIsLoadingOceanSlice);
  const setIsLoadingArgoProfiles = useOceanStore((s) => s.setIsLoadingArgoProfiles);

  // Initialize demo data helpers (Prabhu will replace with real implementation)
  useEffect(() => {
    setDemoDataHelpers(createMockDemoDataHelpers());
  }, []);

  // Initialize globe bridge (KKJ will provide __OCEANX_GLOBE_INIT__)
  useGlobeBridge();

  // Sync globe state
  const { updateCamera, markGlobeReady } = useGlobeSync();

  // Handle globe ready event from KKJ
  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    markGlobeReady();
  }, [setGlobeReady, markGlobeReady]);

  // Listen for globe ready
  useEffect(() => {
    const globeCanvas = document.getElementById('globe-canvas');
    if (!globeCanvas) return;

    const checkGlobeReady = () => {
      if (globeCanvas.dataset.globeReady === 'true') {
        handleGlobeReady();
      }
    };

    // Check immediately
    checkGlobeReady();

    // Also listen for custom event from KKJ
    const handleGlobeReadyEvent = () => handleGlobeReady();
    window.addEventListener('oceanx:globe-ready', handleGlobeReadyEvent);

    return () => {
      window.removeEventListener('oceanx:globe-ready', handleGlobeReadyEvent);
    };
  }, [handleGlobeReady]);

  // Initialize KKJ's globe when available
  useEffect(() => {
    const initGlobe = async () => {
      if (window.__OCEANX_GLOBE_INIT__) {
        setIsLoadingOceanSlice(true);
        setIsLoadingArgoProfiles(true);

        try {
          const initialState = {
            variable: useOceanStore.getState().variable,
            depth: useOceanStore.getState().depth,
            time: useOceanStore.getState().time,
            bounds: useOceanStore.getState().bounds,
            showArgo: useOceanStore.getState().showArgo,
            showCurrents: useOceanStore.getState().showCurrents,
          };

          const events = {
            onArgoMarkerClick: window.__OCEANX_GLOBE_BRIDGE__?.handleMarkerClick || (() => {}),
            onGlobeReady: handleGlobeReady,
            onCameraChange: updateCamera,
            setVariable: (v: OceanVariable) => useOceanStore.getState().setVariable(v),
            setDepth: (d: number) => useOceanStore.getState().setDepth(d),
            setTime: (t: string) => useOceanStore.getState().setTime(t),
            setShowArgo: (s: boolean) => useOceanStore.getState().setShowArgo(s),
            setShowCurrents: (s: boolean) => useOceanStore.getState().setShowCurrents(s),
            setSelectedArgoId: (id: string | null) => useOceanStore.getState().setSelectedArgoId(id || undefined),
          };

          const container = document.getElementById('globe-canvas') as HTMLDivElement;
          if (!container) throw new Error('Globe canvas not found');

          const globeInstance = await window.__OCEANX_GLOBE_INIT__!({
            container,
            initialState,
            events,
            demoDataPath: '/demo-data',
          });

          window.__OCEANX_GLOBE_INSTANCE__ = globeInstance;
        } catch (error) {
          console.error('Failed to initialize globe:', error);
          // Fallback: mark as ready anyway for UI development
          handleGlobeReady();
        } finally {
          setIsLoadingOceanSlice(false);
          setIsLoadingArgoProfiles(false);
        }
      }
    };

    // Wait a bit for KKJ's globe to register
    const timer = setTimeout(initGlobe, 100);
    return () => clearTimeout(timer);
  }, [handleGlobeReady, updateCamera, setIsLoadingOceanSlice, setIsLoadingArgoProfiles]);

  return <MainLayout />;
}

export default OceanXApp;