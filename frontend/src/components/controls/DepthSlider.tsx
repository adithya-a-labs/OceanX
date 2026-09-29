import { useCallback, useMemo, useState } from 'react';
import { useOceanStore } from '../../store';
import { Scrubber, type ScrubberStation } from '../ui';
import { formatDepth } from '../../utils/formatters';
import type { DemoManifest } from '../../types/demoData';

type DemoDepth = DemoManifest['depths'][number];

/**
 * A rational, invertible stretch of the depth axis.
 *
 * Depth is not perceptually uniform: the interesting near-surface structure is
 * compressed into the first few tens of metres, so a linear axis either wastes
 * the track on the deep end or crushes the shallow end into a few pixels.
 * A plain `d / (d + K)` compression with `K = maxDepth / 5` spreads the
 * catalogued levels evenly while staying strictly monotonic and exactly
 * invertible, which is what `Scrubber` needs to map a pixel back to a depth.
 */
const makeAxis = (maxDepth: number) => {
  const K = maxDepth / 5;
  if (K <= 0) {
    return {
      toRatio: (depth: number) => (maxDepth === 0 ? 0 : depth / maxDepth),
      fromRatio: (ratio: number) => ratio * maxDepth,
    };
  }
  const end = maxDepth / (maxDepth + K);
  return {
    toRatio: (depth: number) => depth / (depth + K) / end,
    fromRatio: (ratio: number) => {
      const a = ratio * end;
      return a >= 1 ? maxDepth : (a * K) / (1 - a);
    },
  };
};

export const DepthSlider = () => {
  const manifest = useOceanStore((s) => s.manifest);
  const depth = useOceanStore((s) => s.depth);
  const setDepth = useOceanStore((s) => s.setDepth);
  const [draft, setDraft] = useState<number | null>(null);

  const levels = useMemo<DemoDepth[]>(
    () => [...(manifest?.depths ?? [])].sort((a, b) => a.requestedDepthM - b.requestedDepthM),
    [manifest],
  );

  const maxDepth = levels.at(-1)?.requestedDepthM ?? 500;
  const axis = useMemo(() => makeAxis(maxDepth), [maxDepth]);

  const stations = useMemo<ScrubberStation[]>(
    () =>
      levels.map((d) => ({
        at: axis.toRatio(d.requestedDepthM),
        label: d.requestedDepthM === 0 ? 'surface' : `~${d.requestedDepthM}m`,
        description:
          d.actualDepthM !== d.requestedDepthM
            ? `model ${d.actualDepthM.toFixed(1)} m`
            : undefined,
      })),
    [levels, axis],
  );

  /** The catalogued level the given depth resolves to. */
  const nearestLevel = useCallback(
    (value: number) =>
      levels.reduce(
        (best, candidate) =>
          Math.abs(candidate.requestedDepthM - value) < Math.abs(best.requestedDepthM - value)
            ? candidate
            : best,
        levels[0],
      ),
    [levels],
  );

  const resolved = nearestLevel(draft ?? depth);
  const dragging = draft !== null && draft !== depth;
  const showTarget = resolved !== undefined && resolved.requestedDepthM !== (draft ?? depth);

  const commit = useCallback(
    (value: number) => {
      const level = nearestLevel(value);
      // `setDepth` snaps internally, so calling it on every pointer frame would
      // publish a fresh state object for every pixel of travel. Only write when
      // the resolved catalogued level actually changes.
      if (level && level.requestedDepthM !== depth) setDepth(level.requestedDepthM);
    },
    [nearestLevel, setDepth, depth],
  );

  const handleValueChange = useCallback((value: number) => setDraft(value), []);

  const handleCommit = useCallback(
    (value: number) => {
      setDraft(null);
      commit(value);
    },
    [commit],
  );

  const displayLevel = useMemo(() => nearestLevel(draft ?? depth), [draft, depth, nearestLevel]);

  if (levels.length === 0) {
    return (
      <div className="space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Depth
        </span>
        <p className="text-xs text-text-muted">Depth catalogue unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Depth
        </span>
        <span
          className={`font-mono text-sm tabular-nums ${
            dragging ? 'text-primary' : 'text-text-primary'
          }`}
        >
          {displayLevel
            ? `${formatDepth(displayLevel.requestedDepthM)}, model ${displayLevel.actualDepthM.toFixed(1)} m`
            : formatDepth(draft ?? depth)}
        </span>
      </div>

      <Scrubber
        value={depth}
        onValueChange={handleValueChange}
        onCommit={handleCommit}
        stations={stations}
        toRatio={axis.toRatio}
        fromRatio={axis.fromRatio}
        min={0}
        max={maxDepth}
        step={1}
        label="Ocean depth"
        valueText={(value) => {
          const level = nearestLevel(value);
          return level
            ? `${formatDepth(level.requestedDepthM)}, model level ${level.actualDepthM.toFixed(1)} m`
            : formatDepth(value);
        }}
        className="w-full"
      />

      {showTarget && resolved && (
        <p className="font-mono text-[11px] text-text-muted" aria-live="off">
          {resolved.requestedDepthM === 0
            ? 'surface'
            : `~${resolved.requestedDepthM} m`}{' '}
          · model {resolved.actualDepthM.toFixed(1)} m
        </p>
      )}
    </div>
  );
};

export default DepthSlider;
