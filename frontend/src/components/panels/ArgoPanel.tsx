import { useState, useEffect } from 'react';
import { useOceanStore } from '../../store';
import { Button, Card, Skeleton } from '../ui';
import { Icons, Icon } from '../ui/Icon';
import { ComparisonChart } from './ComparisonChart';
import { InsightCard } from './InsightCard';
import { formatCoordinate } from '../../utils/formatters';
import type { ArgoComparison } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { getArgoProfile } from '../../data';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ArgoPanelProps {
  className?: string;
}

export const ArgoPanel = ({ className = '' }: ArgoPanelProps) => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const modelReady = useOceanStore((s) => s.manifest?.assetsReady ?? false);
  const { data: observation } = useQuery({
    queryKey: ['argoProfile', selectedArgoId],
    queryFn: () => getArgoProfile(selectedArgoId!),
    enabled: !!selectedArgoId,
  });
  const profile = useOceanStore((s) => s.argoComparison);
  const isLoading = useOceanStore((s) => s.isComparisonLoading);
  const clearSelection = useOceanStore((s) => s.setSelectedArgoId);
  const prefersReducedMotion = useReducedMotion();
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-expand when a different float is selected
  useEffect(() => {
    setIsMinimized(false);
  }, [selectedArgoId]);

  if (!selectedArgoId) return null;

  // Honour the OS reduced-motion setting: fade only, no sliding.
  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : { x: '100%', opacity: 0 };

  const argoProfile = profile as ArgoComparison | null;
  const isComparison = !!argoProfile;
  const displayProfile = argoProfile ?? observation;

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div
          key="argo-minimized-taskbar"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ zIndex: 'var(--z-panels)' }}
          className="absolute right-6 top-[88px] glass-panel flex flex-col items-center py-3 px-2 rounded-xl border border-border shadow-lg cursor-pointer hover:border-primary/60 transition-colors"
          onClick={() => setIsMinimized(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsMinimized(false)}
          aria-label="Expand Argo Float Details"
          title="Click to expand Argo Float Details"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1.5 rounded-lg text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            title="Expand panel"
            aria-label="Expand panel"
          >
            <Icon name={Icons.ChevronLeft} size={18} />
          </button>

          <div className="my-2 p-1.5 rounded-full bg-accent/20 text-accent">
            <Icon name={Icons.MapPin} size={16} />
          </div>

          <span
            className="text-xs font-mono font-medium text-text-primary tracking-wider my-2 select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {selectedArgoId}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection(undefined);
            }}
            className="mt-2 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <Icon name={Icons.X} size={14} />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="argo-expanded-panel"
          initial={hidden}
          animate={{ x: 0, opacity: 1 }}
          exit={hidden}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`argo-panel ${className}`}
        >
          <div className="h-full p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Argo Float Details</h2>
                <p className="text-sm text-text-muted mt-1">Platform: {selectedArgoId}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ChevronRight}
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize panel"
                  title="Minimize to side taskbar"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.X}
                  onClick={() => clearSelection(undefined)}
                  aria-label="Close panel"
                  title="Close"
                />
              </div>
            </div>

          {/* Metadata Card */}
          <Card padding="md">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted">Latitude</p>
                <p className="font-mono text-text-primary">
                  {displayProfile ? formatCoordinate(displayProfile.latitude, true) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Longitude</p>
                <p className="font-mono text-text-primary">
                  {displayProfile ? formatCoordinate(displayProfile.longitude, false) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Time</p>
                <p className="font-mono text-text-primary">
                  {displayProfile ? new Date(displayProfile.time).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Variable</p>
                <p className="font-mono text-text-primary capitalize">
                  {argoProfile?.variable || '—'}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Mini Chart */}
          <Card padding="md">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Profile ({argoProfile?.variable || 'temperature'})
            </h3>
            <div className="h-[120px]" aria-label="Profile chart placeholder">
              {isLoading ? (
                <Skeleton variant="chart" className="h-full" />
              ) : argoProfile ? (
                <ComparisonChart
                  data={argoProfile}
                  height={120}
                  showDifference={false}
                  compact
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary">
                  {observation ? 'Observation values shown below' : 'Loading observation…'}
                </div>
              )}
            </div>
          </Card>

          {!modelReady && observation && (
            <Card padding="md">
              <p className="text-sm text-text-secondary">
                Real Argo delayed-mode profile · adjusted QC 1 · {observation.depthM.at(-1)?.toFixed(0)} m maximum depth
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-xs text-text-secondary">
                <span>Depth</span><span>Temp</span><span>Salinity</span>
                {observation.depthM.filter((_, i) => i % Math.max(1, Math.floor(observation.depthM.length / 6)) === 0).map(depth => {
                  const i = observation.depthM.indexOf(depth);
                  return <div className="col-span-3 grid grid-cols-3" key={i}>
                    <span>{depth.toFixed(0)} m</span>
                    <span>{observation.temperatureDegC[i].toFixed(2)} °C</span>
                    <span>{observation.salinity[i]?.toFixed(2) ?? '—'}</span>
                  </div>;
                })}
              </div>
              <p className="mt-3 text-xs text-text-muted">Model comparison awaits Copernicus data export.</p>
            </Card>
          )}

          {/* Comparison Chart (if available) */}
          {isComparison && (
            <Card padding="md">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                Model vs Observation
              </h3>
              <div className="h-[200px]" aria-label="Comparison chart">
                <ComparisonChart
                  data={argoProfile}
                  height={200}
                  showDifference={true}
                />
              </div>
            </Card>
          )}

          {/* Insight Card */}
          {isComparison && (
            <InsightCard
              observationId={selectedArgoId}
              comparison={argoProfile}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <Card padding="md">
              <div className="space-y-3">
                <Skeleton variant="text" className="h-4 w-1/4" />
                <Skeleton variant="text" className="h-4 w-1/2" />
                <Skeleton variant="text" className="h-4 w-3/4" />
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
};

export default ArgoPanel;
