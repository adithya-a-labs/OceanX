import { useOceanStore } from '../../store';
import { Button, Card, Skeleton } from '../ui';
import { Icons } from '../ui/Icon';
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
      <motion.div
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
            <Button
              variant="ghost"
              size="sm"
              icon={Icons.X}
              onClick={() => clearSelection(undefined)}
              aria-label="Close panel"
            />
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
    </AnimatePresence>
  );
};

export default ArgoPanel;
