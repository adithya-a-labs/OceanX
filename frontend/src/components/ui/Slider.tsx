import { Scrubber, type ScrubberStation } from './Scrubber';

export interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  marks?: Array<{ value: number; label: string }>;
  label?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const toRatio = (min: number, max: number) => (value: number) =>
  max === min ? 0 : (value - min) / (max - min);

const fromRatio = (min: number, max: number) => (ratio: number) =>
  min + ratio * (max - min);

/**
 * A uniform continuous slider.
 *
 * The previous implementation was a native `<input type="range">` with the
 * track painted through an inline `linear-gradient`, a glow shadow on hover, and
 * a `calc()`-offset thumb. The native element cannot be styled to a flat
 * instrument look, and its `marks` were purely decorative. This wraps `Scrubber`
 * instead, so marks are real keyboard stops and the track is two solid blocks.
 *
 * For a non-linear axis (see `DepthSlider`) use `Scrubber` directly.
 */
export const Slider = ({
  min,
  max,
  step,
  value,
  onChange,
  marks,
  label = 'Slider',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: SliderProps) => {
  const stations: ScrubberStation[] | undefined =
    marks && marks.length > 0
      ? marks.map((m) => ({
          at: toRatio(min, max)(m.value),
          label: m.label,
          description: String(m.value),
        }))
      : undefined;

  return (
    <Scrubber
      value={value}
      onValueChange={onChange}
      stations={stations}
      toRatio={toRatio(min, max)}
      fromRatio={fromRatio(min, max)}
      min={min}
      max={max}
      step={step}
      label={ariaLabel ?? label}
      valueText={(v) => String(v)}
      disabled={disabled}
      className={className}
    />
  );
};

export default Slider;
