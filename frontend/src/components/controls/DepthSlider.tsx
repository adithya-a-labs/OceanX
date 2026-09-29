import { useCallback, useMemo, useState, useEffect } from 'react';
import { useOceanStore } from '../../store';
import { Button, Scrubber, type ScrubberStation } from '../ui';
import { Icons } from '../ui/Icon';
import type { DemoManifest } from '../../types/demoData';

type DemoDepth = DemoManifest['depths'][number];

const DEFAULT_DEPTHS: DemoDepth[] = [
  { id: 'depth-0', requestedDepthM: 0, actualDepthM: 0.49 },
  { id: 'depth-50', requestedDepthM: 50, actualDepthM: 47.37 },
  { id: 'depth-100', requestedDepthM: 100, actualDepthM: 92.33 },
  { id: 'depth-150', requestedDepthM: 150, actualDepthM: 142.50 },
  { id: 'depth-200', requestedDepthM: 200, actualDepthM: 186.13 },
  { id: 'depth-500', requestedDepthM: 500, actualDepthM: 541.09 },
];

export const DepthSlider = () => {
  const manifest = useOceanStore((s) => s.manifest);
  const depth = useOceanStore((s) => s.depth);
  const setDepth = useOceanStore((s) => s.setDepth);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);

  // Standard oceanographic depth levels: 0, 50, 100, 150, 200, 500
  const levels = useMemo<DemoDepth[]>(() => {
    const raw = manifest?.depths && manifest.depths.length > 0 ? manifest.depths : DEFAULT_DEPTHS;
    const depthsMap = new Map<number, DemoDepth>();
    
    // Seed with standard levels so 50, 100, 150, 200 are always present
    DEFAULT_DEPTHS.forEach((d) => depthsMap.set(d.requestedDepthM, d));
    // Overlay manifest values
    raw.forEach((d) => depthsMap.set(d.requestedDepthM, d));

    return Array.from(depthsMap.values()).sort((a, b) => a.requestedDepthM - b.requestedDepthM);
  }, [manifest]);

  const currentIndex = useMemo(() => {
    const idx = levels.findIndex((d) => d.requestedDepthM === depth);
    if (idx >= 0) return idx;
    // Find closest level if exact match not found
    let closestIdx = 0;
    let minDiff = Infinity;
    levels.forEach((lvl, i) => {
      const diff = Math.abs(lvl.requestedDepthM - depth);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    return closestIdx;
  }, [levels, depth]);

  const span = Math.max(1, levels.length - 1);

  const stations = useMemo<ScrubberStation[]>(
    () =>
      levels.map((d, i) => ({
        at: i / span,
        label: d.requestedDepthM === 0 ? 'Surface' : `${d.requestedDepthM}m`,
        description: `Nominal ${d.requestedDepthM} m (Actual ${d.actualDepthM.toFixed(1)} m)`,
      })),
    [levels, span],
  );

  const handleStep = useCallback(
    (direction: number) => {
      const from = draftIndex ?? currentIndex;
      const nextIdx = Math.max(0, Math.min(levels.length - 1, from + direction));
      const targetLevel = levels[nextIdx];
      if (targetLevel) {
        setDepth(targetLevel.requestedDepthM);
        setDraftIndex(null);
      }
    },
    [currentIndex, draftIndex, levels, setDepth],
  );

  // Clear draft when depth store changes
  useEffect(() => {
    setDraftIndex(null);
  }, [depth]);

  const displayIndex = draftIndex ?? currentIndex;
  const displayLevel = levels[displayIndex] ?? levels[0];
  const disabled = levels.length <= 1;

  return (
    <div className="space-y-2.5">
      {/* Header with both requested depth and actual model depth */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Ocean Depth
        </span>
        <div className="flex items-baseline gap-1.5 font-mono text-xs tabular-nums text-text-primary">
          <span className="font-bold text-primary text-sm">
            {displayLevel.requestedDepthM === 0 ? 'Surface (0 m)' : `${displayLevel.requestedDepthM} m`}
          </span>
          <span className="text-text-muted text-[11px]">
            (actual {displayLevel.actualDepthM.toFixed(1)} m)
          </span>
        </div>
      </div>

      {/* Discrete indexed Scrubber with live actual depth tooltip */}
      <Scrubber
        value={currentIndex}
        onValueChange={(v) => {
          const idx = Math.max(0, Math.min(levels.length - 1, Math.round(v)));
          setDraftIndex(idx);
          const target = levels[idx];
          if (target && target.requestedDepthM !== depth) {
            setDepth(target.requestedDepthM);
          }
        }}
        onCommit={(v) => {
          const idx = Math.max(0, Math.min(levels.length - 1, Math.round(v)));
          setDraftIndex(null);
          const target = levels[idx];
          if (target && target.requestedDepthM !== depth) {
            setDepth(target.requestedDepthM);
          }
        }}
        stations={stations}
        toRatio={(v) => v / span}
        fromRatio={(r) => r * span}
        min={0}
        max={span}
        step={1}
        label="Ocean Depth Level"
        valueText={(v) => {
          const idx = Math.max(0, Math.min(levels.length - 1, Math.round(v)));
          const lvl = levels[idx];
          if (!lvl) return `${depth} m`;
          return lvl.requestedDepthM === 0
            ? `Surface (${lvl.actualDepthM.toFixed(1)} m)`
            : `${lvl.requestedDepthM} m (act: ${lvl.actualDepthM.toFixed(1)} m)`;
        }}
        tickLabels="all"
        disabled={disabled}
        className="w-full"
      />

      {/* Quick Level Preset Pills + Step Controls */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5 no-scrollbar">
          {levels.map((lvl) => {
            const isSelected = lvl.requestedDepthM === depth;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  setDraftIndex(null);
                  setDepth(lvl.requestedDepthM);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
                title={`Target: ${lvl.requestedDepthM}m · Actual: ${lvl.actualDepthM.toFixed(1)}m`}
              >
                {lvl.requestedDepthM === 0 ? 'Surface' : `${lvl.requestedDepthM}m`}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={Icons.ChevronLeft}
            onClick={() => handleStep(-1)}
            disabled={disabled || currentIndex === 0}
            aria-label="Shallower depth"
            title="Step to shallower level"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Icons.ChevronRight}
            onClick={() => handleStep(1)}
            disabled={disabled || currentIndex === levels.length - 1}
            aria-label="Deeper depth"
            title="Step to deeper level"
          />
        </div>
      </div>
    </div>
  );
};

export default DepthSlider;
