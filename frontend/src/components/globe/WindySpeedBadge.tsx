import { useOceanStore } from '../../store';
import { Icons, Icon } from '../ui/Icon';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export const WindySpeedBadge = () => {
  const showCurrents = useOceanStore((s) => s.showCurrents);
  const showCurrentScale = useOceanStore((s) => s.showCurrentScale);
  const setShowCurrentScale = useOceanStore((s) => s.setShowCurrentScale);
  const prefersReducedMotion = useReducedMotion();

  if (!showCurrents || !showCurrentScale) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { y: 15, opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ zIndex: 'var(--z-panels)' }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-1.5 p-3 rounded-md bg-surface/90 border border-border backdrop-blur-md shadow-2xl pointer-events-auto select-none w-72"
        role="region"
        aria-label="Wind and Currents Speed Scale"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Icon name={Icons.Waves} size={14} className="text-cyan-400" />
              Bay of Bengal Currents
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCurrentScale(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close scale"
            title="Dismiss velocity scale"
          >
            <Icon name={Icons.X} size={13} />
          </button>
        </div>

        {/* Windy Color Spectrum Bar */}
        <div className="space-y-1 mt-1">
          <div
            className="h-2 w-full rounded-full shadow-inner border border-white/10"
            style={{
              background:
                'linear-gradient(to right, #38bdf8 0%, #22d3ee 25%, #34d399 50%, #facc15 75%, #ffffff 100%)',
            }}
          />
          <div className="flex justify-between font-mono text-[10px] text-text-muted">
            <span>0 m/s (Calm)</span>
            <span>0.35</span>
            <span>0.8+ m/s (Gale)</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WindySpeedBadge;
