import { useState, useCallback, useEffect } from 'react';
import { useOceanStore } from '../../store';
import { Button } from '../ui';
import { Icons } from '../ui/Icon';
import { formatTime, formatDateTime } from '../../utils/formatters';

interface TimeScrubberProps {
  availableTimes?: string[];
  onPlay?: () => void;
  onPause?: () => void;
}

const DEFAULT_TIMES = ['2026-09-24T12:00:00Z'];

export const TimeScrubber = ({ availableTimes = DEFAULT_TIMES, onPlay, onPause }: TimeScrubberProps) => {
  const time = useOceanStore((s) => s.time);
  const setTime = useOceanStore((s) => s.setTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync index with time
  useEffect(() => {
    const index = availableTimes.indexOf(time);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [time, availableTimes]);

  const handleTimeChange = useCallback((newTime: string) => {
    setTime(newTime);
    const index = availableTimes.indexOf(newTime);
    if (index !== -1) setCurrentIndex(index);
  }, [setTime, availableTimes]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleStep = useCallback((direction: number) => {
    const newIndex = Math.max(0, Math.min(availableTimes.length - 1, currentIndex + direction));
    handleTimeChange(availableTimes[newIndex]);
  }, [currentIndex, availableTimes, handleTimeChange]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || availableTimes.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % availableTimes.length;
      handleTimeChange(availableTimes[nextIndex]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, availableTimes, handleTimeChange]);

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
          disabled={availableTimes.length <= 1}
          aria-label="Previous time step"
        />
        <Button
          variant={isPlaying ? 'secondary' : 'primary'}
          size="sm"
          icon={isPlaying ? Icons.Pause : Icons.Play}
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={availableTimes.length <= 1}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Icons.SkipForward}
          onClick={() => handleStep(1)}
          disabled={availableTimes.length <= 1}
          aria-label="Next time step"
        />
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={availableTimes.length - 1}
          step={1}
          value={currentIndex}
          onChange={(e) => handleTimeChange(availableTimes[Number(e.target.value)])}
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
          {availableTimes.map((t, i) => (
            <span
              key={t}
              style={{ left: `${(i / (availableTimes.length - 1)) * 100}%` }}
              className={`relative whitespace-nowrap ${
                i === 0 ? '' : i === availableTimes.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
              } ${i === currentIndex ? 'text-text-primary font-medium' : ''}`}
            >
              {formatTime(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-secondary text-center">
        {formatDateTime(time)}
      </div>
    </div>
  );
};

export default TimeScrubber;