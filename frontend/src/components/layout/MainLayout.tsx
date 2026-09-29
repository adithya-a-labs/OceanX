import { useOceanStore } from '../../store';
import { ControlPanel } from './ControlPanel';
import { ArgoPanel, RecentArgoFloats } from '../panels';
import { WindySpeedBadge } from '../globe/WindySpeedBadge';
import { Icons, Icon } from '../ui/Icon';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback } from 'react';

export const MainLayout = () => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const isGlobeReady = useOceanStore((s) => s.isGlobeReady);
  const manifest = useOceanStore((s) => s.manifest);
  const error = useOceanStore((s) => s.error);
  const setError = useOceanStore((s) => s.setError);
  const prefersReducedMotion = useReducedMotion();

  // Quick camera presets
  const handleFlyToBayOfBengal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.__OCEANX_GLOBE_INSTANCE__?.flyToBayOfBengal?.(2.0);
    }
  }, []);

  const handleGlobalOrbit = useCallback(() => {
    if (typeof window !== 'undefined' && window.__OCEANX_GLOBE_INSTANCE__) {
      window.__OCEANX_GLOBE_INSTANCE__.setCamera({
        longitude: 78.0,
        latitude: 12.0,
        zoom: 3.5,
        bearing: 0,
        pitch: -88,
      });
    }
  }, []);

  return (
    <div className="recording-viewport relative bg-background overflow-hidden select-none">
      {/* Globe Canvas - Cesium 3D Engine mounts here */}
      <div
        id="globe-canvas"
        className="globe-canvas"
        data-globe-ready={isGlobeReady}
        role="application"
        aria-label="3D Ocean Globe"
      />

      {/* Control Panel - Left sidebar with spring taskbar minimization */}
      <ControlPanel />

      {/* Argo Float Details Panel - Right sidebar */}
      <AnimatePresence mode="wait">
        {selectedArgoId && <ArgoPanel />}
      </AnimatePresence>

      {/* Recent Argo Floats Floating Dock */}
      <RecentArgoFloats />

      {/* Windy.com Style Live Currents Velocity Badge */}
      <WindySpeedBadge />

      {/* Global error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[76px] left-1/2 -translate-x-1/2 z-panels flex items-center gap-2 max-w-lg px-4 py-2.5 rounded-md bg-surface border border-error shadow-2xl"
          >
            <Icon name={Icons.AlertCircle} size={16} className="text-error shrink-0" />
            <span className="text-sm text-text-primary">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Dismiss error"
              title="Dismiss"
            >
              <Icon name={Icons.X} size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint badge when no float is currently selected */}
      <AnimatePresence>
        {!selectedArgoId && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ zIndex: 'var(--z-panels)' }}
            className="absolute right-6 top-[76px] panel-flat flex items-center gap-2.5 py-2 px-3 rounded-md pointer-events-none select-none border border-border"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-medium text-text-secondary">
              Select an Argo float marker to inspect
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplified Clean Header: OceanX Brand + Presets Only */}
      <header className="absolute top-0 left-0 right-0 h-[60px] z-modals px-6 flex items-center justify-between border-b border-border bg-surface">
        <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">
          OceanX
        </h1>

        <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-md p-1">
          <button
            type="button"
            onClick={handleFlyToBayOfBengal}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Focus camera on Bay of Bengal demo region"
          >
            <Icon name={Icons.MapPin} size={13} className="text-primary" />
            <span>Bay of Bengal</span>
          </button>
          <button
            type="button"
            onClick={handleGlobalOrbit}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Switch to Global Earth orbit camera"
          >
            <Icon name={Icons.Globe} size={13} className="text-text-muted" />
            <span>Orbit View</span>
          </button>
        </div>
      </header>

      {/* Footer Status Bar */}
      <footer className="absolute bottom-0 left-0 right-0 h-[44px] z-modals px-6 flex items-center border-t border-border bg-surface">
        <div className="flex w-full items-center justify-between text-xs font-mono text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Icon name={Icons.Map} size={13} className="text-primary" />
              {manifest?.region.name ?? 'Bay of Bengal'} ({manifest?.region.south ?? 10}°N–{manifest?.region.north ?? 20}°N, {manifest?.region.west ?? 80}°E–{manifest?.region.east ?? 92}°E)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-text-primary font-semibold">OceanX v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;