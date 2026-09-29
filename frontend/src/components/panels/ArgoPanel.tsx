import { useOceanStore } from '../../store';
import { Button, Card, Skeleton } from '../ui';
import { Icons } from '../ui/Icon';
import { ComparisonChart } from './ComparisonChart';
import { InsightCard } from './InsightCard';
import { formatCoordinate } from '../../utils/formatters';
import type { ArgoComparison } from '../../types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ArgoPanelProps {
  className?: string;
}

export const ArgoPanel = ({ className = '' }: ArgoPanelProps) => {
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
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
                  {argoProfile ? formatCoordinate(argoProfile.latitude, true) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Longitude</p>
                <p className="font-mono text-text-primary">
                  {argoProfile ? formatCoordinate(argoProfile.longitude, false) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Time</p>
                <p className="font-mono text-text-primary">
                  {argoProfile ? new Date(argoProfile.time).toLocaleString() : '—'}
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
                  No profile data available
                </div>
              )}
            </div>
          </Card>

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