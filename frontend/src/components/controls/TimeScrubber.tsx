import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOceanStore } from '../../store';
import { Button } from '../ui';
import { Icons } from '../ui/Icon';
import { formatDateTime } from '../../utils/formatters';

interface TimeScrubberProps {
  availableTimes?: string[];
  onPlay?: () => void;
  onPause?: () => void;
}

export const TimeScrubber = ({ availableTimes, onPlay, onPause }: TimeScrubberProps) => {
  const manifest = useOceanStore((s) => s.manifest);
  const times = useMemo(() => availableTimes ?? manifest?.times.map(t => t.iso) ?? [], [availableTimes, manifest]);
  const time = useOceanStore((s) => s.time);
  const setTime = useOceanStore((s) => s.setTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync index with time
  useEffect(() => {
    const index = times.indexOf(time);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [time, times]);

  const handleTimeChange = useCallback((newTime: string) => {
    setTime(newTime);
    const index = times.indexOf(newTime);
    if (index !== -1) setCurrentIndex(index);
  }, [setTime, times]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleStep = useCallback((direction: number) => {
    const newIndex = Math.max(0, Math.min(times.length - 1, currentIndex + direction));
    if (times[newIndex]) handleTimeChange(times[newIndex]);
  }, [currentIndex, times, handleTimeChange]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || times.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % times.length;
      handleTimeChange(times[nextIndex]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, times, handleTimeChange]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Time
      </label>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Icons.SkipBack}
          onClick={() => handleStep(-1)}
          disabled={times.length <= 1}
          aria-label="Previous time step"
        />
        <Button
          variant={isPlaying ? 'secondary' : 'primary'}
          size="sm"
          icon={isPlaying ? Icons.Pause : Icons.Play}
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={times.length <= 1}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Icons.SkipForward}
          onClick={() => handleStep(1)}
          disabled={times.length <= 1}
          aria-label="Next time step"
        />
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={Math.max(0, times.length - 1)}
          step={1}
          value={currentIndex}
          onChange={(e) => { const selected = times[Number(e.target.value)]; if (selected) handleTimeChange(selected); }}
          disabled={times.length <= 1}
          style={{
            backgroundImage: 'linear-gradient(var(--color-surface), var(--color-surface))',
            backgroundSize: '100% 8px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          className="w-full h-6 appearance-none rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          aria-label="Time scrubber"
        />
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          {times.map((t, i) => (
            <span
              key={t}
              style={{ left: `${(i / Math.max(1, times.length - 1)) * 100}%` }}
              className={`relative whitespace-nowrap ${
                i === 0 ? '' : i === times.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
              } ${i === currentIndex ? 'text-text-primary font-medium' : ''}`}
            >
              {t.slice(0, 10)}
            </span>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-secondary text-center">
        {time ? formatDateTime(time) : 'Loading dates…'}
        {manifest && !manifest.assetsReady ? ' · planned dates' : ''}
      </div>
    </div>
  );
};

export default TimeScrubber;
