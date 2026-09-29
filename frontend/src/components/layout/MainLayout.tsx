import { useOceanStore } from '../../store';
import { ControlPanel } from './ControlPanel';
import { ArgoPanel } from '../panels/ArgoPanel';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

export const MainLayout = () => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const isGlobeReady = useOceanStore((s) => s.isGlobeReady);
  const manifest = useOceanStore((s) => s.manifest);
  const error = useOceanStore((s) => s.error);
  const setError = useOceanStore((s) => s.setError);
  const prefersReducedMotion = useReducedMotion();
  const [controlPanelCollapsed, setControlPanelCollapsed] = useState(false);

  return (
    <div className="recording-viewport relative bg-background overflow-hidden">
      {/* Globe Canvas - KKJ mounts Three.js here */}
      <div
        id="globe-canvas"
        className="globe-canvas"
        data-globe-ready={isGlobeReady}
        role="application"
        aria-label="3D Ocean Globe"
      />

      {/* Control Panel - Left sidebar with collapse */}
      {!controlPanelCollapsed && <ControlPanel />}
      <button
        type="button"
        className={`absolute left-2 top-[88px] z-panels p-1.5 rounded-md bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer ${
          controlPanelCollapsed ? 'rotate-180' : ''
        }`}
        onClick={() => setControlPanelCollapsed(!controlPanelCollapsed)}
        aria-label={controlPanelCollapsed ? 'Expand control panel' : 'Collapse control panel'}
        aria-expanded={!controlPanelCollapsed}
      >
        <Icon name={Icons.ChevronLeft} size={16} />
      </button>

      {/* Argo Panel - Right sidebar (slide-in) */}
      <AnimatePresence mode="wait">
        {selectedArgoId && <ArgoPanel />}
      </AnimatePresence>

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
            className="absolute top-[84px] left-1/2 -translate-x-1/2 z-panels flex items-center gap-2 max-w-lg px-4 py-2.5 rounded-md bg-surface border border-error"
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

      {/* No-selection hint: the Argo panel is selected-only, so say so up front */}
      <AnimatePresence>
        {!selectedArgoId && !controlPanelCollapsed && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: -24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ zIndex: 'var(--z-panels)' }}
            className="absolute right-6 top-[88px] panel-flat flex items-center gap-2 py-2 pl-3 pr-4 rounded-md pointer-events-none select-none"
          >
            <Icon name={Icons.MapPin} size={14} className="text-primary shrink-0" />
            <span className="text-xs text-text-secondary">
              Select a float to inspect its profile
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal top bar - only error handling */}
      <header className="absolute top-0 left-0 right-0 h-[72px] z-modals px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-text-primary">OceanX</h1>
        </div>
      </header>

      {/* Bottom status bar - minimal */}
      <footer className="absolute bottom-0 left-0 right-0 h-[48px] z-modals px-6 flex items-center border-t border-border bg-surface">
        <div className="flex w-full items-center justify-between text-xs text-text-secondary">
          <span>{manifest?.region.name ?? 'Bay of Bengal'} · {manifest?.region.south ?? 10}°N–{manifest?.region.north ?? 20}°N, {manifest?.region.west ?? 80}°E–{manifest?.region.east ?? 92}°E</span>
          <span>OceanX v0.1.0</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;