import { useOceanStore } from '../../store';
import { oceanTokens } from '../../design-system';

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

  const gradient = VARIABLE_GRADIENTS[variable];
  const unit = VARIABLE_UNITS[variable];
  const label = VARIABLE_LABELS[variable];

  // These would come from actual data in production
  const mockMinMax = {
    temperature: { min: 18, max: 30 },
    salinity: { min: 33, max: 35.5 },
    currents: { min: 0, max: 1.5 },
  };

  const { min, max } = mockMinMax[variable];

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
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;