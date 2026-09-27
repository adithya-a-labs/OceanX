import { forwardRef, type InputHTMLAttributes } from 'react';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'min' | 'max' | 'step' | 'onChange'> {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  marks?: Array<{ value: number; label: string }>;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ min, max, step, value, onChange, marks, disabled, className = '', 'aria-label': ariaLabel, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            aria-label={ariaLabel}
            style={{
              // Paint only an 8px band inside a taller box: a comfortable
              // pointer/drag target without changing the track's appearance.
              backgroundImage: 'linear-gradient(var(--color-surface), var(--color-surface))',
              backgroundSize: '100% 8px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            className={`
              h-6 w-full appearance-none rounded-full cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            {...props}
          />
          <div
            className={`
              pointer-events-none absolute h-2 rounded-full bg-primary transition-all duration-150
              top-1/2 left-0 -translate-y-1/2
            `}
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          />
          <div
            className={`
              pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary
              border-2 border-background shadow-2
              transition-all duration-150
              hover:scale-110 hover:shadow-glow
            `}
            style={{ left: `calc(${percentage}% - 12px)` }}
            aria-hidden="true"
          />
        </div>
        
        {marks && marks.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-text-secondary">
            {marks.map((mark, i) => (
              <span
                key={mark.value}
                style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
                // Anchor the first/last labels to the track ends so they are not
                // pushed outside the panel by the -translate-x-1/2 centring.
                className={`relative whitespace-nowrap ${
                  i === 0 ? '' : i === marks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
                }`}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;