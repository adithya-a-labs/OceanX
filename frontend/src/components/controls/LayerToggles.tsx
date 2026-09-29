import { useOceanStore } from '../../store';
import { Toggle } from '../ui';
import { Icons } from '../ui/Icon';

export const LayerToggles = () => {
  const showArgo = useOceanStore((s) => s.showArgo);
  const setShowArgo = useOceanStore((s) => s.setShowArgo);
  const showCurrents = useOceanStore((s) => s.showCurrents);
  const setShowCurrents = useOceanStore((s) => s.setShowCurrents);
  const showCurrentScale = useOceanStore((s) => s.showCurrentScale);
  const setShowCurrentScale = useOceanStore((s) => s.setShowCurrentScale);

  const handleCurrentsChange = (checked: boolean) => {
    setShowCurrents(checked);
    if (!checked) {
      setShowCurrentScale(false);
    }
  };

  const handleScaleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showCurrents) {
      setShowCurrents(true);
      setShowCurrentScale(true);
    } else {
      setShowCurrentScale(!showCurrentScale);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Layers
      </span>
      <div className="space-y-2">
        <Toggle
          id="toggle-argo"
          checked={showArgo}
          onChange={setShowArgo}
          label="Argo Floats"
          icon={Icons.MapPin}
        />
        <div className="flex items-center justify-between gap-2">
          <Toggle
            id="toggle-currents"
            checked={showCurrents}
            onChange={handleCurrentsChange}
            label="Wind & Ocean Currents"
            icon={Icons.Waves}
          />
          {showCurrents && (
            <button
              type="button"
              onClick={handleScaleToggle}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer shrink-0 ${
                showCurrentScale
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-surface border-border text-text-muted hover:text-text-primary'
              }`}
              title={showCurrentScale ? 'Hide velocity scale' : 'Show velocity scale'}
            >
              Scale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerToggles;