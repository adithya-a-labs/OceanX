import { useOceanStore } from '../../store';
import { useArgoProfiles } from '../../hooks/useOceanData';
import { useArgoSelection } from '../../hooks/useArgoSelection';
import { Icons } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui';
import { formatCoordinate } from '../../utils/formatters';

/**
 * Lists the Argo profiles available for the current variable/depth/time and
 * lets the user open one. The globe (KKJ) can drive the same selection through
 * the marker bridge; until the globe lands, this is the only way to reach the
 * details panel.
 */
export const ProfileSelector = () => {
  const variable = useOceanStore((s) => s.variable);
  const depth = useOceanStore((s) => s.depth);
  const time = useOceanStore((s) => s.time);
  const selectedArgoId = useOceanStore((s) => s.selectedArgoId);
  const { selectArgo, clearSelection } = useArgoSelection();
  const { data: profiles, isLoading, isError } = useArgoProfiles(variable, depth, time);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
          Argo Floats
        </label>
        {selectedArgoId && (
          <button
            onClick={clearSelection}
            // Padding grows the hit area past the 24px minimum; the matching
            // negative margin keeps the heading row from getting any taller.
            className="-mx-1.5 -my-1 rounded px-1.5 py-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2" aria-label="Loading Argo floats">
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-xs text-text-muted">Could not load Argo floats.</p>
      )}

      {!isLoading && !isError && profiles && profiles.length === 0 && (
        <p className="text-xs text-text-muted">
          No floats report {variable} at {depth} m.
        </p>
      )}

      {!isLoading && !isError && profiles && profiles.length > 0 && (
        <ul className="space-y-1.5" role="listbox" aria-label="Argo floats">
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedArgoId;
            return (
              <li key={profile.id}>
                <button
                  role="option"
                  aria-selected={isSelected}
                  onClick={() =>
                    isSelected
                      ? clearSelection()
                      : selectArgo({
                          id: profile.id,
                          latitude: profile.latitude,
                          longitude: profile.longitude,
                        })
                  }
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left
                    rounded-md border transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${
                      isSelected
                        ? 'bg-surface-elevated border-primary'
                        : 'bg-surface border-border hover:border-border-hover'
                    }
                  `}
                >
                  <Icon
                    name={isSelected ? Icons.CheckCircle : Icons.MapPin}
                    size={16}
                    className={isSelected ? 'text-primary' : 'text-text-muted'}
                  />
                  <span className="min-w-0">
                    <span
                      className={`block font-mono text-xs font-medium truncate ${
                        isSelected ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {profile.id}
                    </span>
                    <span className="block font-mono text-[11px] text-text-muted truncate">
                      {formatCoordinate(profile.latitude, true)} &middot;{' '}
                      {formatCoordinate(profile.longitude, false)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProfileSelector;
