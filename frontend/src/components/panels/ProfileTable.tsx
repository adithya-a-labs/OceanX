import { useMemo } from 'react';
import { getUnit } from '../../utils/formatters';
import type { DemoArgoProfile } from '../../types';

/**
 * Aligned temperature / salinity levels for one Argo profile.
 *
 * A real cast carries 100+ levels, which is far more than a side panel can show
 * readably. The table therefore displays evenly spaced levels — always
 * including the shallowest and deepest — and states how many levels were
 * sampled so the reader never mistakes it for the complete cast.
 */
interface ProfileTableProps {
  profile: DemoArgoProfile;
  rows?: number;
}

const EM_DASH = '—';

export const ProfileTable = ({ profile, rows = 8 }: ProfileTableProps) => {
  const { sampled, totalLevels } = useMemo(() => {
    const total = profile.depthM.length;
    const count = Math.max(1, Math.min(rows, total));
    const sampledIndices = Array.from({ length: count }, (_, i) =>
      count === 1 ? 0 : Math.round((i * (total - 1)) / (count - 1)));
    return {
      sampled: sampledIndices.map(i => ({
        depthM: profile.depthM[i],
        temperatureDegC: profile.temperatureDegC[i],
        salinity: profile.salinity[i],
      })),
      totalLevels: total,
    };
  }, [profile, rows]);

  if (sampled.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Observed levels
        </h4>
        <span className="font-mono text-[10px] text-text-muted">
          {sampled.length} of {totalLevels}
        </span>
      </div>

      <table className="w-full border-collapse font-mono text-[11px]">
        <caption className="sr-only">
          Sampled Argo levels: depth in metres, temperature in degrees Celsius, salinity in practical
          salinity units.
        </caption>
        <thead>
          <tr className="text-text-muted">
            <th scope="col" className="py-1 text-left font-medium">Depth</th>
            <th scope="col" className="py-1 text-right font-medium">Temp</th>
            <th scope="col" className="py-1 text-right font-medium">Sal</th>
          </tr>
        </thead>
        <tbody className="text-text-primary">
          {sampled.map((row, i) => (
            <tr key={`${row.depthM}-${i}`} className="border-t border-border-subtle">
              <td className="py-1 text-left tabular-nums">
                {row.depthM.toFixed(row.depthM < 10 ? 1 : 0)}
                <span className="ml-0.5 text-text-muted">m</span>
              </td>
              <td className="py-1 text-right tabular-nums">
                {row.temperatureDegC !== null && Number.isFinite(row.temperatureDegC)
                  ? row.temperatureDegC.toFixed(2)
                  : EM_DASH}
                <span className="ml-0.5 text-text-muted">{getUnit('temperature')}</span>
              </td>
              <td className="py-1 text-right tabular-nums">
                {row.salinity !== null && Number.isFinite(row.salinity)
                  ? row.salinity.toFixed(2)
                  : <span className="text-text-muted">{EM_DASH}</span>}
                <span className="ml-0.5 text-text-muted">{getUnit('salinity')}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfileTable;
