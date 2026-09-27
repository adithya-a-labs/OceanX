import { useOceanStore } from '../../store';
import { ControlPanel } from './ControlPanel';
import { ArgoPanel } from '../panels/ArgoPanel';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { AnimatePresence } from 'framer-motion';

export const MainLayout = () => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const isGlobeReady = useOceanStore((s) => s.isGlobeReady);

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
          <span>Bay of Bengal • 12°N-18°N, 82°E-90°E</span>
          <span>OceanX v0.1.0 • feat/argo-validation</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;