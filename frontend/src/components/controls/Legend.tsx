import { useOceanStore } from '../../store';
import { oceanTokens } from '../../design-system';
import { useQuery } from '@tanstack/react-query';
import { getCurrents, getOceanLayer } from '../../data';

const VARIABLE_GRADIENTS = {
  temperature: oceanTokens.colors.temperature.gradient,
  salinity: oceanTokens.colors.salinity.gradient,
  currents: oceanTokens.colors.currents.gradient,
};

const VARIABLE_UNITS = {
  temperature: oceanTokens.colors.temperature.unit,
  salinity: oceanTokens.colors.salinity.unit,
  currents: oceanTokens.colors.currents.unit,
};

const VARIABLE_LABELS = {
  temperature: 'Temperature',
  salinity: 'Salinity',
  currents: 'Currents',
};

export const Legend = () => {
  const variable = useOceanStore((s) => s.variable);
  const depthId = useOceanStore((s) => s.depthId);
  const timeId = useOceanStore((s) => s.timeId);
  const ready = useOceanStore((s) => s.manifest?.assetsReady ?? false);
  const { data: range } = useQuery({
    queryKey: ['legend', variable, depthId, timeId],
    enabled: ready,
    queryFn: async () => {
      if (variable === 'currents') {
        const field = await getCurrents(timeId);
        const speed = field.speed.flat().filter((x): x is number => x !== null);
        return { min: 0, max: Math.max(...speed) };
      }
      const layer = await getOceanLayer(variable, depthId, timeId);
      return { min: layer.meta.min, max: layer.meta.max };
    },
  });

  const gradient = VARIABLE_GRADIENTS[variable];
  const unit = VARIABLE_UNITS[variable];
  const label = VARIABLE_LABELS[variable];

  if (!ready) return <p className="text-xs text-text-muted">Model color scale pending.</p>;
  if (!range) return <p className="text-xs text-text-muted">Loading color scale…</p>;
  const { min, max } = range;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {label}
      </label>
      <div className="space-y-1.5">
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${gradient.join(', ')})`,
          }}
          role="img"
          aria-label={`${label} color scale from ${min}${unit} to ${max}${unit}`}
        />
        <div className="flex justify-between text-xs text-text-muted font-mono">
          <span>{min.toFixed(2)}{unit}</span>
          <span>{max.toFixed(2)}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;
