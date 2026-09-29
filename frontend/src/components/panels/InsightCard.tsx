import { Card } from '../ui';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { formatRMSE, formatValue, getUnit } from '../../utils/formatters';
import type { ArgoComparison } from '../../types';

interface InsightCardProps {
  observationId: string;
  comparison: ArgoComparison;
}

export const InsightCard = ({ observationId, comparison }: InsightCardProps) => {
  const { rmse, variable, difference, insight: curatedInsight } = comparison;
  const unit = getUnit(variable);

  // Only trust the statistics over levels that carry a finite difference. An
  // empty or all-null difference series must not render NaN or Infinity, and the
  // chart above it is drawn from the same paired levels.
  const paired = difference
    .map((value, i) => ({ value, index: i }))
    .filter(d => Number.isFinite(d.value));

  if (paired.length === 0) {
    return (
      <Card padding="md" className="border-l-4 border-l-border">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-surface-hover text-text-muted">
            <Icon name={Icons.Info} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary">No paired differences</h4>
            <p className="text-sm text-text-secondary mt-1">
              This profile has no levels where the model field and the observation overlap,
              so RMSE and difference statistics are unavailable.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const values = paired.map(d => d.value);
  const avgDiff = values.reduce((a, b) => a + b, 0) / values.length;
  const maxDiff = values.reduce((best, v) => Math.max(best, Math.abs(v)), 0);
  const largest = paired.reduce((best, d) => (Math.abs(d.value) > Math.abs(best.value) ? d : best));

  const largestDepth = comparison.depth[largest.index];
  const description = curatedInsight ?? (
    `The largest model minus observation difference is ${formatValue(largest.value, variable)}` +
    `${Number.isFinite(largestDepth) ? ` near ${largestDepth.toFixed(0)} m` : ''}.`
  );

  const trend = avgDiff > 0 ? 'up' as const : avgDiff < 0 ? 'down' as const : 'stable' as const;
  const trendIcon =
    trend === 'up' ? Icons.TrendingUp : trend === 'down' ? Icons.TrendingDown : Icons.Activity;
  // "Stable" is the absence of a signal, so it reads as muted text rather than
  // spending the accent hue on a label.
  const severityColor = trend === 'stable' ? 'text-text-muted' : 'text-text-primary';

  return (
    <Card padding="md" className="border-l-2 border-l-primary">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 p-2 rounded-md bg-surface-elevated border border-border ${severityColor}`}
        >
          <Icon name={trendIcon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-text-primary">Largest paired difference</h4>
            {Number.isFinite(rmse) && (
              <span
                className="text-xs font-mono text-primary px-2 py-0.5 rounded-sm bg-surface-elevated border border-border whitespace-nowrap"
                title={`${unit} root mean square error`}
              >
                {formatRMSE(rmse, unit)}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Icon name={Icons.BarChart2} size={12} />
              Avg diff: {formatValue(avgDiff, variable)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name={Icons.TrendingUp} size={12} />
              Max diff: {formatValue(maxDiff, variable)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name={Icons.MapPin} size={12} />
              Float: {observationId}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InsightCard;
