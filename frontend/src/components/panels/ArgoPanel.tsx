import { useState, useEffect } from 'react';
import { useOceanStore } from '../../store';
import { Button, Card, Skeleton } from '../ui';
import { Icons, Icon } from '../ui/Icon';
import { ComparisonChart } from './ComparisonChart';
import { InsightCard } from './InsightCard';
import { ProfileChart } from './ProfileChart';
import { ProfileTable } from './ProfileTable';
import { formatCoordinate, formatDateTime, getUnit, getVariableLabel } from '../../utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { getArgoProfile } from '../../data';
import { useArgoComparison } from '../../hooks/useOceanData';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { LayerVariable } from '../../types';

interface ArgoPanelProps {
  className?: string;
}

/** Currents are not an Argo variable, so the profile falls back to temperature. */
function profileVariable(variable: string): LayerVariable {
  return variable === 'salinity' ? 'salinity' : 'temperature';
}

export const ArgoPanel = ({ className = '' }: ArgoPanelProps) => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const clearSelection = useOceanStore((s) => s.clearSelectedArgo);
  const variable = useOceanStore((s) => s.variable);
  const modelReady = useOceanStore((s) => s.manifest?.assetsReady ?? false);
  const prefersReducedMotion = useReducedMotion();
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-expand when a different float is selected
  useEffect(() => {
    setIsMinimized(false);
  }, [selectedArgoId]);

  const { data: observation, isPending: isObservationPending, isError: isObservationError,
    error: observationError, refetch: refetchObservation } = useQuery({
    queryKey: ['argoProfile', selectedArgoId],
    queryFn: () => getArgoProfile(selectedArgoId!),
    enabled: !!selectedArgoId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const { data: comparison, isPending: isComparisonPending, isError: isComparisonError,
    error: comparisonError, refetch: refetchComparison } = useArgoComparison(
      selectedArgoId, modelReady);

  if (!selectedArgoId) return null;

  // Honour the OS reduced-motion setting: fade only, no sliding.
  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : { x: '100%', opacity: 0 };

  const shownVariable = profileVariable(variable);
  const unit = getUnit(shownVariable);
  const maxDepthM = observation?.depthM.at(-1);

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
              clearSelection();
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
          <div className="h-full overflow-y-auto p-4 space-y-3">
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
                  onClick={() => clearSelection()}
                  aria-label="Close panel"
                  title="Close"
                />
              </div>
            </div>

            {isObservationError ? (
              <Card padding="md" role="alert">
                <div className="flex items-start gap-2">
                  <Icon name={Icons.AlertCircle} size={16} className="mt-0.5 text-danger shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">Could not load this float</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {observationError instanceof Error
                        ? observationError.message
                        : 'The observation profile could not be read.'}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Icons.RefreshCw}
                      className="mt-3"
                      onClick={() => void refetchObservation()}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Metadata */}
                <Card padding="md">
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Metadata</h3>
                  {isObservationPending || !observation ? (
                    <div className="grid grid-cols-2 gap-3" aria-hidden>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                          <Skeleton variant="text" className="h-2.5 w-1/2" />
                          <Skeleton variant="text" className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-text-muted">Latitude</p>
                        <p className="font-mono text-text-primary">
                          {formatCoordinate(observation.latitude, true)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Longitude</p>
                        <p className="font-mono text-text-primary">
                          {formatCoordinate(observation.longitude, false)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Profile time</p>
                        <p className="font-mono text-text-primary">
                          {formatDateTime(observation.time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Max depth</p>
                        <p className="font-mono text-text-primary">
                          {maxDepthM !== undefined ? `${maxDepthM.toFixed(0)} m` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Cycle</p>
                        <p className="font-mono text-text-primary">{observation.cycle}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Data mode</p>
                        <p className="font-mono text-text-primary">
                          {observation.source.dataMode === 'D' ? 'Delayed' : observation.source.dataMode}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Observed profile */}
                <Card padding="md">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium text-text-secondary">
                      Observed profile
                    </h3>
                    <span className="font-mono text-[11px] text-text-muted">{unit}</span>
                  </div>
                  {shownVariable !== variable && (
                    <p className="mb-2 text-[11px] leading-relaxed text-text-muted">
                      Argo profiles do not measure currents, so the {getVariableLabel(shownVariable).toLowerCase()} profile is shown for this float.
                    </p>
                  )}
                  <div className="h-[180px]">
                    {isObservationPending || !observation ? (
                      <Skeleton variant="chart" className="h-full" />
                    ) : (
                      <ProfileChart
                        profile={observation}
                        variable={shownVariable}
                        height={180}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                    OBSERVATION — Argo Float {observation?.id ?? selectedArgoId}
                    {observation ? ` · ${observation.source.provider} · ${observation.quality.method}` : ''}
                  </p>
                </Card>

                {/* Observed levels table */}
                {observation && (
                  <Card padding="md">
                    <ProfileTable profile={observation} />
                  </Card>
                )}

                {/* Model comparison */}
                {modelReady ? (
                  <>
                    {isComparisonPending && (
                      <Card padding="md">
                        <h3 className="text-sm font-medium text-text-secondary mb-3">
                          Model vs Observation
                        </h3>
                        <Skeleton variant="chart" />
                        <div className="mt-3 space-y-2" aria-hidden>
                          <Skeleton variant="text" className="h-3 w-full" />
                          <Skeleton variant="text" className="h-3 w-2/3" />
                        </div>
                        <span className="sr-only" role="status">Loading model comparison</span>
                      </Card>
                    )}

                    {isComparisonError && (
                      <Card padding="md" role="alert">
                        <div className="flex items-start gap-2">
                          <Icon name={Icons.AlertCircle} size={16} className="mt-0.5 text-warning shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary">
                              Comparison unavailable
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {comparisonError instanceof Error
                                ? comparisonError.message
                                : 'The model comparison could not be read.'}
                            </p>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Icons.RefreshCw}
                              className="mt-3"
                              onClick={() => void refetchComparison()}
                            >
                              Retry
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {comparison && !isComparisonPending && !isComparisonError && (
                      <>
                        <Card padding="md">
                          <h3 className="text-sm font-medium text-text-secondary mb-3">
                            Model vs Observation
                          </h3>
                          <div className="h-[220px]">
                            <ComparisonChart data={comparison} height={220} showDifference />
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                            MODEL FIELD — Copernicus Marine, {getVariableLabel(shownVariable)} in {unit}.
                            Nearest in space and time, depth linearly interpolated.
                          </p>
                        </Card>

                        <InsightCard
                          observationId={selectedArgoId}
                          comparison={comparison}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Card padding="md">
                    <div className="flex items-start gap-2">
                      <Icon name={Icons.Info} size={16} className="mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Model comparison pending
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-text-muted">
                          This float is real and fully observed. The Copernicus Marine model export
                          for this region is not staged yet, so only the observed profile is shown.
                          The comparison, RMSE, and difference series appear once the model fields
                          arrive.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArgoPanel;
