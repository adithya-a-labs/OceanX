import { useOceanStore } from '../../store';
import { oceanTokens } from '../../design-system';
import { useQuery } from '@tanstack/react-query';
import { getCurrents, getOceanLayer } from '../../data';
import { formatDepth } from '../../utils/formatters';

const VARIABLE_SWATCHES = {
  temperature: oceanTokens.colors.temperature.swatches,
  salinity: oceanTokens.colors.salinity.swatches,
  currents: oceanTokens.colors.currents.swatches,
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
  const manifest = useOceanStore((s) => s.manifest);
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

  const swatches = VARIABLE_SWATCHES[variable];
  const unit = VARIABLE_UNITS[variable];
  const label = VARIABLE_LABELS[variable];

  if (!ready) {
    // Name the real model levels rather than only saying "pending": the depths are
    // already verified against the catalogue even though the fields are not staged.
    const levels = (manifest?.depths ?? []).map(d => d.actualDepthM);
    return (
      <div className="space-y-2">
        <p className="text-xs text-text-muted">Model color scale pending.</p>
        {levels.length > 0 && (
          <p className="font-mono text-[11px] leading-relaxed text-text-muted">
            {levels.map(d => formatDepth(d, true)).join(' · ')}
          </p>
        )}
      </div>
    );
  }
  if (!range) return <p className="text-xs text-text-muted">Loading color scale…</p>;
  const { min, max } = range;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <span className="font-mono text-[10px] text-text-muted">{unit}</span>
      </div>

      {/* Discrete swatches rather than a gradient: the ramp is shown as separate
          solid blocks, so nothing here depends on interpolating between colors. */}
      <div
        className="flex h-2.5 gap-px overflow-hidden rounded-sm border border-border"
        role="img"
        aria-label={`${label} color scale from ${min}${unit} to ${max}${unit}`}
      >
        {swatches.map((color, i) => (
          <span
            key={color}
            aria-hidden="true"
            className="flex-1 first:rounded-l-[1px] last:rounded-r-[1px]"
            style={{ backgroundColor: color }}
            data-swatch={i}
          />
        ))}
      </div>

      <div className="flex justify-between font-mono text-[11px] text-text-secondary">
        <span>{min.toFixed(2)}{unit}</span>
        <span>{max.toFixed(2)}{unit}</span>
      </div>
    </div>
  );
};

export default Legend;
