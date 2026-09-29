import { useOceanStore } from '../../store';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import type { LayerVariable } from '../../types/demoData';

/**
 * Gridded variables only. Currents is a velocity field rather than a gridded
 * layer, and selecting it is owned by the Currents toggle in `LayerToggles` —
 * offering it here as well let the two disagree about what the globe was showing.
 */
const VARIABLE_OPTIONS = [
  { value: 'temperature', label: 'Temperature', icon: Icons.Thermometer },
  { value: 'salinity', label: 'Salinity', icon: Icons.Droplet },
] as const;

export const VariableSelector = () => {
  const variable = useOceanStore((s) => s.variable);
  const setVariable = useOceanStore((s) => s.setVariable);

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Variable
      </span>
      <div className="flex gap-2">
        {VARIABLE_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setVariable(value as LayerVariable)}
            className={`
              flex-1 flex flex-col items-center gap-1.5 px-3 py-3
              rounded-md border transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
              ${
                variable === value
                  ? 'bg-surface-elevated border-primary text-primary'
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
