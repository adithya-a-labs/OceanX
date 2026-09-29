import { Card } from '../ui';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { formatRMSE, formatValue } from '../../utils/formatters';
import type { ArgoComparison } from '../../types';

interface InsightCardProps {
  observationId: string;
  comparison: ArgoComparison;
}

export const InsightCard = ({ observationId, comparison }: InsightCardProps) => {
  const { rmse, variable, difference } = comparison;

  // Determine insight based on RMSE and difference pattern
  const avgDiff = difference.reduce((a, b) => a + b, 0) / difference.length;
  const maxDiff = Math.max(...difference.map(Math.abs));
  
  const maxIndex = difference.reduce((best, value, i) =>
    Math.abs(value) > Math.abs(difference[best]) ? i : best, 0);
  const insight = {
    title: 'Largest paired difference',
    description: `The largest model minus observation difference is ${formatValue(difference[maxIndex], variable)} near ${comparison.depth[maxIndex]?.toFixed(0)} m.`,
    severity: 'info' as const,
    trend: avgDiff > 0 ? 'up' as const : avgDiff < 0 ? 'down' as const : 'stable' as const,
  };

  const trendIcon = insight.trend === 'up' ? Icons.TrendingUp : insight.trend === 'down' ? Icons.TrendingDown : Icons.Activity;
  const severityColor = {
    info: 'text-info',
    warning: 'text-warning',
    critical: 'text-error',
  }[insight.severity];

  return (
    <Card padding="md" className="border-l-4 border-l-primary">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg bg-primary/10 ${severityColor}`}>
          <Icon name={trendIcon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-text-primary">{insight.title}</h4>
            <span className="text-xs font-mono text-primary px-2 py-0.5 rounded bg-primary/10">
              {formatRMSE(rmse)}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Icon name={Icons.BarChart2} size={12} />
              Avg diff: {formatValue(avgDiff, variable as any)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name={Icons.TrendingUp} size={12} />
              Max diff: {formatValue(maxDiff, variable as any)}
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
