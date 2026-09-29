import { useOceanStore } from '../../store';
import { Toggle } from '../ui';
import { Icons } from '../ui/Icon';

export const LayerToggles = () => {
  const showArgo = useOceanStore((s) => s.showArgo);
  const setShowArgo = useOceanStore((s) => s.setShowArgo);
  const showCurrents = useOceanStore((s) => s.showCurrents);
  const setShowCurrents = useOceanStore((s) => s.setShowCurrents);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Layers
      </label>
      <div className="space-y-2">
        <Toggle
          id="toggle-argo"
          checked={showArgo}
          onChange={setShowArgo}
          label="Argo Floats"
          icon={Icons.MapPin}
        />
        <Toggle
          id="toggle-currents"
          checked={showCurrents}
          onChange={setShowCurrents}
          label="Currents"
          icon={Icons.Waves}
        />
      </div>
    </div>
  );
};

export default LayerToggles;