import { useOceanStore } from '../../store';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import type { OceanVariable } from '../../types';

const VARIABLE_OPTIONS = [
  { value: 'temperature', label: 'Temperature', icon: Icons.Thermometer },
  { value: 'salinity', label: 'Salinity', icon: Icons.Droplet },
  { value: 'currents', label: 'Currents', icon: Icons.Waves },
] as const;

export const VariableSelector = () => {
  const variable = useOceanStore((s) => s.variable);
  const setVariable = useOceanStore((s) => s.setVariable);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
        Variable
      </label>
      <div className="flex gap-2">
        {VARIABLE_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setVariable(value as OceanVariable)}
            className={`
              flex-1 flex flex-col items-center gap-1.5 px-3 py-3
              rounded-lg border-2 transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${variable === value
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-surface border-border text-text-secondary hover:border-border-hover hover:text-text-primary'
              }
            `}
            aria-pressed={variable === value}
          >
            <Icon name={icon} size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VariableSelector;