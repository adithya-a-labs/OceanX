import { useCallback, useMemo, useState, useEffect } from 'react';
import { useOceanStore } from '../../store';
import { Button, Scrubber, type ScrubberStation } from '../ui';
import { Icons } from '../ui/Icon';
import { formatDepth } from '../../utils/formatters';
import type { DemoManifest } from '../../types/demoData';

type DemoDepth = DemoManifest['depths'][number];

export const DepthSlider = () => {
  const manifest = useOceanStore((s) => s.manifest);
  const depth = useOceanStore((s) => s.depth);
  const setDepth = useOceanStore((s) => s.setDepth);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);

  const levels = useMemo<DemoDepth[]>(
    () => [...(manifest?.depths ?? [])].sort((a, b) => a.requestedDepthM - b.requestedDepthM),
    [manifest],
  );

  const currentIndex = useMemo(() => {
    const idx = levels.findIndex((d) => d.requestedDepthM === depth);
    return idx >= 0 ? idx : 0;
  }, [levels, depth]);

  const span = Math.max(1, levels.length - 1);

  const stations = useMemo<ScrubberStation[]>(
    () =>
      levels.map((d, i) => ({
        at: i / span,
        label: d.requestedDepthM === 0 ? 'Surface' : `${d.requestedDepthM}m`,
        description: `Model ${d.actualDepthM.toFixed(1)} m`,
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
  const displayLevel = levels[displayIndex];
  const disabled = levels.length <= 1;

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
    <div className="space-y-2.5">
      {/* Header with clear synchronized information */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Ocean Depth
        </span>
        <span className="font-mono text-xs tabular-nums text-text-primary">
          {displayLevel ? (
            <>
              <span className="font-bold text-primary">
                {displayLevel.requestedDepthM === 0 ? 'Surface (0 m)' : `${displayLevel.requestedDepthM} m`}
              </span>
              <span className="text-text-muted ml-1.5 text-[11px]">
                (model {displayLevel.actualDepthM.toFixed(1)} m)
              </span>
            </>
          ) : (
            formatDepth(depth)
          )}
        </span>
      </div>

      {/* Discrete indexed Scrubber */}
      <Scrubber
        value={currentIndex}
        onValueChange={(v) => {
          const idx = Math.max(0, Math.min(levels.length - 1, Math.round(v)));
          setDraftIndex(idx);
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
          return lvl
            ? `${formatDepth(lvl.requestedDepthM)}, model ${lvl.actualDepthM.toFixed(1)} m`
            : formatDepth(depth);
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
                onClick={() => setDepth(lvl.requestedDepthM)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
                title={`Select depth level ${lvl.requestedDepthM}m (model: ${lvl.actualDepthM.toFixed(1)}m)`}
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
