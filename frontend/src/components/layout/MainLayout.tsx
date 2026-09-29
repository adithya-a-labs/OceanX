import { useOceanStore } from '../../store';
import { ControlPanel } from './ControlPanel';
import { ArgoPanel } from '../panels/ArgoPanel';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export const MainLayout = () => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const isGlobeReady = useOceanStore((s) => s.isGlobeReady);
  const manifest = useOceanStore((s) => s.manifest);
  const error = useOceanStore((s) => s.error);
  const setError = useOceanStore((s) => s.setError);
  const prefersReducedMotion = useReducedMotion();

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

      {/* Control Panel - Left sidebar */}
      <ControlPanel />

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
            className="absolute top-[84px] left-1/2 -translate-x-1/2 z-panels flex items-center gap-2 max-w-lg px-4 py-2.5 rounded-xl bg-error/15 border border-error/40 backdrop-blur-sm shadow-lg"
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
        {!selectedArgoId && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ zIndex: 'var(--z-panels)' }}
            className="absolute right-6 top-[88px] glass-panel flex items-center gap-2 py-2 pl-3 pr-4 rounded-xl border border-border shadow-lg pointer-events-none select-none"
          >
            <Icon name={Icons.MapPin} size={14} className="text-primary shrink-0" />
            <span className="text-xs text-text-secondary">
              Select a float to inspect its profile
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar - Title and recording indicator */}
      <header className="absolute top-0 left-0 right-0 h-[72px] z-modals px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon name={Icons.Globe} size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">OceanX</h1>
            <p className="text-xs text-text-secondary">Submission Build</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {manifest && !manifest.assetsReady && (
            <div className="px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-medium">
              Model data pending · real Argo observations only
            </div>
          )}
          {/* Globe Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border ${isGlobeReady ? 'text-success' : 'text-warning'}`}>
            <span className={`w-2 h-2 rounded-full ${isGlobeReady ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            <span className="text-xs font-medium">
              {isGlobeReady ? 'Globe Ready' : 'Initializing...'}
            </span>
          </div>

          {/* Recording Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 border border-error/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-error" />
            <span className="text-xs font-mono font-medium text-error-bright">REC</span>
            <span className="text-xs text-text-secondary">1920×1080</span>
          </div>
        </div>
      </header>

      {/* Bottom status bar */}
      <footer className="absolute bottom-0 left-0 right-0 h-[48px] z-modals px-6 flex items-center border-t border-border bg-surface/50 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between text-xs text-text-secondary">
          <span>{manifest?.region.name ?? 'Bay of Bengal'} · {manifest?.region.south ?? 10}°N–{manifest?.region.north ?? 20}°N, {manifest?.region.west ?? 80}°E–{manifest?.region.east ?? 92}°E</span>
          <span>OceanX v0.1.0 · {manifest?.assetsReady ? 'Copernicus + Argo' : 'Argo observations'}</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
