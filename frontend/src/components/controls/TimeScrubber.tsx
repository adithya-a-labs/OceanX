import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useOceanStore } from '../../store';
import { Button, Scrubber, type ScrubberStation } from '../ui';
import { Icons } from '../ui/Icon';
import { formatDateTime } from '../../utils/formatters';

interface TimeScrubberProps {
  availableTimes?: string[];
  onPlay?: () => void;
  onPause?: () => void;
}

const PLAYBACK_MS = 1000;

export const TimeScrubber = ({ availableTimes, onPlay, onPause }: TimeScrubberProps) => {
  const manifest = useOceanStore((s) => s.manifest);
  const time = useOceanStore((s) => s.time);
  const setTime = useOceanStore((s) => s.setTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);

  const times = useMemo(
    () => availableTimes ?? manifest?.times.map((t) => t.iso) ?? [],
    [availableTimes, manifest],
  );

  // The playback interval must not depend on the index, or every tick would tear
  // down and re-create the timer. Read the live index from a ref instead.
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  const applyIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= times.length) return;
      const iso = times[index];
      if (!iso) return;
      setTime(iso);
      setCurrentIndex(index);
    },
    [setTime, times],
  );

  // Follow the store: time can also change from the globe or the store actions.
  useEffect(() => {
    const index = times.indexOf(time);
    if (index !== -1) {
      setCurrentIndex(index);
      setDraftIndex(null);
    }
  }, [time, times]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleStep = useCallback(
    (direction: number) => {
      const from = draftIndex ?? currentIndex;
      applyIndex(Math.max(0, Math.min(times.length - 1, from + direction)));
      setDraftIndex(null);
    },
    [applyIndex, currentIndex, draftIndex, times.length],
  );

  useEffect(() => {
    if (!isPlaying || times.length <= 1) return;
    const id = window.setInterval(() => {
      applyIndex((indexRef.current + 1) % times.length);
    }, PLAYBACK_MS);
    return () => window.clearInterval(id);
  }, [applyIndex, isPlaying, times.length]);

  // Index-based axis: the manifest may hold irregular intervals, so the track is
  // uniform in steps rather than in elapsed time.
  const span = Math.max(1, times.length - 1);
  const stations = useMemo<ScrubberStation[]>(
    () => times.map((iso, i) => ({ at: i / span, label: iso.slice(0, 10) })),
    [times, span],
  );

  const displayIndex = draftIndex ?? currentIndex;
  const displayIso = times[Math.min(displayIndex, times.length - 1)];
  const disabled = times.length <= 1;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Time
        </span>
        <span className="font-mono text-xs tabular-nums text-text-primary">
          {displayIso ? formatDateTime(displayIso) : 'Loading dates…'}
          {manifest && !manifest.assetsReady ? ' · planned' : ''}
        </span>
      </div>

      <Scrubber
        value={currentIndex}
        onValueChange={(v) => setDraftIndex(Math.round(v))}
        onCommit={(v) => {
          const index = Math.round(v);
          setDraftIndex(null);
          applyIndex(index);
        }}
        stations={stations}
        toRatio={(v) => v / span}
        fromRatio={(r) => r * span}
        min={0}
        max={span}
        step={1}
        label="Time"
        valueText={(v) => (times[Math.min(Math.round(v), times.length - 1)]
          ? formatDateTime(times[Math.min(Math.round(v), times.length - 1)])
          : 'No time selected')}
        // Full ISO dates would collide at any realistic panel width; the ends
        // anchor the axis and the current instant is read out above.
        tickLabels="ends"
        disabled={disabled}
        className="w-full"
      />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Icons.SkipBack}
          onClick={() => handleStep(-1)}
          disabled={disabled || currentIndex === 0}
          aria-label="Previous time step"
        />
        <Button
          variant={isPlaying ? 'secondary' : 'primary'}
          size="sm"
          icon={isPlaying ? Icons.Pause : Icons.Play}
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={disabled}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Icons.SkipForward}
          onClick={() => handleStep(1)}
          disabled={disabled || currentIndex === times.length - 1}
          aria-label="Next time step"
        />
      </div>
    </div>
  );
};

export default TimeScrubber;
