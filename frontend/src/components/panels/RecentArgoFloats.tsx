import { useOceanStore } from '../../store';
import { useArgoSelection } from '../../hooks/useArgoSelection';
import { Icons, Icon } from '../ui/Icon';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export const RecentArgoFloats = () => {
  const recentArgoIds = useOceanStore((s) => s.recentArgoIds);
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const clearRecentArgo = useOceanStore((s) => s.clearRecentArgo);
  const { selectArgo } = useArgoSelection();
  const prefersReducedMotion = useReducedMotion();

  // If there are no recents, don't show the dock
  if (!recentArgoIds || recentArgoIds.length === 0) {
    return null;
  }

  // Filter out currently selected one if it ever appeared in recents
  const displayRecents = recentArgoIds.filter((id) => id !== selectedArgoId).slice(0, 3);

  if (displayRecents.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ zIndex: 'var(--z-panels)' }}
      className="absolute bottom-16 right-6 flex flex-col items-end gap-1.5 pointer-events-auto select-none"
    >
      <div className="flex items-center justify-between gap-2 w-full px-2 py-0.5">
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-text-muted">
          <Icon name={Icons.Activity} size={12} className="text-primary animate-pulse" />
          Recent Floats ({displayRecents.length})
        </span>
        <button
          type="button"
          onClick={clearRecentArgo}
          className="text-[10px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          title="Clear recent floats"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="popLayout">
          {displayRecents.map((id, index) => (
            <motion.button
              key={id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => selectArgo({ id, latitude: 0, longitude: 0 })}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-md bg-surface/95 border border-border hover:border-primary hover:bg-surface-elevated shadow-lg backdrop-blur-md transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title={`Jump to Argo Float ${id}`}
            >
              <div className="p-1 rounded bg-surface border border-border text-primary group-hover:border-primary/50 transition-colors">
                <Icon name={Icons.MapPin} size={13} />
              </div>

              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {id}
                </span>
                <span className="font-mono text-[9px] text-text-muted flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-success inline-block" />
                  Slot #{index + 1} · Click to view
                </span>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary ml-0.5">
                <Icon name={Icons.ChevronRight} size={14} />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RecentArgoFloats;
