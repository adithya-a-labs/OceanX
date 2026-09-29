import { useState } from 'react';
import { useOceanStore } from '../../store';
import { VariableSelector, DepthSlider, TimeScrubber, LayerToggles, Legend, ProfileSelector } from '../controls';
import { Button } from '../ui';
import { Icons, Icon } from '../ui/Icon';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export const ControlPanel = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const variable = useOceanStore((s) => s.variable);
  const depth = useOceanStore((s) => s.depth);
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : { x: '-100%', opacity: 0 };

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div
          key="control-minimized-taskbar"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ zIndex: 'var(--z-panels)' }}
          className="absolute left-6 top-[88px] panel-flat flex flex-col items-center py-3 px-2 rounded-md cursor-pointer hover:border-primary transition-colors select-none shadow-xl"
          onClick={() => setIsMinimized(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsMinimized(false)}
          aria-label="Expand Instrument Controls"
          title="Click to expand Controls"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1.5 rounded-md text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Expand Controls"
            aria-label="Expand Controls"
          >
            <Icon name={Icons.ChevronRight} size={18} />
          </button>

          <div className="my-2 p-1.5 rounded-md bg-surface border border-border text-primary">
            <Icon name={Icons.Layers} size={16} />
          </div>

          <span
            className="text-xs font-mono font-medium text-text-primary tracking-wider my-2 select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            CONTROLS · {variable.toUpperCase()}
          </span>

          <div className="mt-2 px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-primary font-bold">
            {depth === 0 ? 'SURF' : `${depth}m`}
          </div>
        </motion.div>
      ) : (
        <motion.aside
          key="control-expanded-panel"
          initial={hidden}
          animate={{ x: 0, opacity: 1 }}
          exit={hidden}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="control-panel flex flex-col overflow-y-auto space-y-5"
        >
          {/* Panel Header with Title and Minimize Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                <Icon name={Icons.Layers} size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-wide uppercase">
                  Instrument Controls
                </h2>
                <p className="text-[11px] text-text-muted font-mono">
                  Telemetry & 3D Layer Matrix
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={Icons.ChevronLeft}
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize Controls"
              title="Minimize to side taskbar"
            />
          </div>

          <VariableSelector />
          <Legend />
          <DepthSlider />
          <TimeScrubber />
          <ProfileSelector />
          <LayerToggles />
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ControlPanel;