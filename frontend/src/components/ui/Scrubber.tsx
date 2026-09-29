import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface ScrubberStation {
  /** Normalized position along the track, 0..1. */
  at: number;
  /** Short label rendered under the tick. */
  label: string;
  /** Spoken description for assistive tech. */
  description?: string;
}

export interface ScrubberProps {
  /** The committed value. The thumb rests here when idle. */
  value: number;
  /** Continuous value while dragging and while settling. */
  onValueChange?: (value: number) => void;
  /** Fired once at the end of a drag, with the released value. */
  onCommit?: (value: number) => void;
  /**
   * Discrete track positions. They drive the tick marks and, more importantly,
   * the keyboard model: arrows walk the stations instead of stepping by a fixed
   * increment, so a non-uniform axis (0/50/100/200/500) stays reachable.
   */
  stations?: ScrubberStation[];
  /** Domain value -> 0..1 track position. Should invert `fromRatio`. */
  toRatio: (value: number) => number;
  /** 0..1 track position -> domain value. */
  fromRatio: (ratio: number) => number;
  min: number;
  max: number;
  /** Keyboard increment, used only when no stations are supplied. */
  step?: number;
  label: string;
  valueText: (value: number) => string;
  header?: ReactNode;
  footer?: ReactNode;
  tickLabels?: 'all' | 'ends' | 'none';
  disabled?: boolean;
  className?: string;
  id?: string;
}

const SETTLE_MS = 170;
const EPS = 1e-4;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const clampRatio = (v: number) => clamp(v, 0, 1);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * A flat instrument scrubber.
 *
 * Replaces the native range input, which cannot express a non-linear axis
 * (ocean depth is stretched so surface layers are not crushed), cannot show
 * discrete stations, and cannot stream a continuous draft value while the
 * consumer snaps to a catalogued level. Pointer, touch, and keyboard all run
 * through one code path.
 */
export const Scrubber = ({
  value,
  onValueChange,
  onCommit,
  stations,
  toRatio,
  fromRatio,
  min,
  max,
  step = 1,
  label,
  valueText,
  header,
  footer,
  tickLabels = 'all',
  disabled = false,
  className = '',
  id,
}: ScrubberProps) => {
  const prefersReducedMotion = useReducedMotion();
  // Unconditional: `id ?? useId()` would call the hook only when `id` is
  // absent, so flipping between provided/unprovided `id` would change hook
  // order between renders.
  const generatedId = useId();
  const sliderId = id ?? generatedId;

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const settlingRef = useRef(false);
  const liveRef = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const settleRef = useRef(0);

  // Latest props, so rAF callbacks never close over a stale render.
  const valueRef = useRef(value);
  const toRatioRef = useRef(toRatio);
  const fromRatioRef = useRef(fromRatio);
  const emitRef = useRef(onValueChange);
  const commitRef = useRef(onCommit);
  const stationsRef = useRef(stations);

  valueRef.current = value;
  toRatioRef.current = toRatio;
  fromRatioRef.current = fromRatio;
  emitRef.current = onValueChange;
  commitRef.current = onCommit;
  stationsRef.current = stations;

  const [liveRatio, setLiveRatio] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const committedRatio = clampRatio(toRatio(value));
  const ratio = liveRatio ?? committedRatio;
  const displayed = clamp(liveRatio === null ? value : fromRatio(liveRatio), min, max);

  // The idle thumb follows the committed value. A drag or a settle owns the
  // transient ratio, so this must not clobber it.
  useEffect(() => {
    if (draggingRef.current || settlingRef.current) return;
    liveRef.current = null;
    setLiveRatio(null);
  }, [value]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      cancelAnimationFrame(settleRef.current);
    },
    [],
  );

  const publish = useCallback(
    (r: number) => {
      const next = clampRatio(r);
      liveRef.current = next;
      setLiveRatio(next);
      emitRef.current?.(clamp(fromRatioRef.current(next), min, max));
    },
    [min, max],
  );

  // Coalesces pointer moves to one update per animation frame.
  const flush = useCallback(() => {
    frameRef.current = 0;
    const r = pendingRef.current;
    if (r === null) return;
    pendingRef.current = null;
    publish(r);
  }, [publish]);

  const stopSettle = useCallback(() => {
    if (settleRef.current) cancelAnimationFrame(settleRef.current);
    settleRef.current = 0;
    settlingRef.current = false;
  }, []);

  // Glides the thumb from the release point to the value the consumer adopted.
  // `onCommit` has already fired, so the store is authoritative and this only
  // removes the jump.
  const settle = useCallback(() => {
    stopSettle();
    const from = liveRef.current;
    if (prefersReducedMotion || from === null) {
      liveRef.current = null;
      setLiveRatio(null);
      return;
    }
    const to = clampRatio(toRatioRef.current(valueRef.current));
    if (Math.abs(to - from) < 0.001) {
      liveRef.current = null;
      setLiveRatio(null);
      return;
    }
    settlingRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SETTLE_MS);
      const r = from + (to - from) * easeOutCubic(t);
      // Report along the way so the caller's readout tracks the thumb instead
      // of snapping to the level a frame before the thumb arrives.
      liveRef.current = r;
      setLiveRatio(r);
      emitRef.current?.(clamp(fromRatioRef.current(r), min, max));
      if (t < 1) {
        settleRef.current = requestAnimationFrame(tick);
      } else {
        settleRef.current = 0;
        settlingRef.current = false;
        liveRef.current = null;
        setLiveRatio(null);
      }
    };
    settleRef.current = requestAnimationFrame(tick);
  }, [min, max, prefersReducedMotion, stopSettle]);

  const ratioFromClientX = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return undefined;
    return clampRatio((clientX - rect.left) / rect.width);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      event.preventDefault();
      stopSettle();
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      pendingRef.current = null;
      draggingRef.current = true;
      setDragging(true);
      // Capture keeps move/up flowing here even when the pointer leaves the hit
      // area or the window.
      event.currentTarget.setPointerCapture(event.pointerId);
      const r = ratioFromClientX(event.clientX);
      if (r !== undefined) publish(r);
    },
    [disabled, publish, ratioFromClientX, stopSettle],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      const r = ratioFromClientX(event.clientX);
      if (r === undefined) return;
      pendingRef.current = r;
      if (!frameRef.current) frameRef.current = requestAnimationFrame(flush);
    },
    [flush, ratioFromClientX],
  );

  const endDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      draggingRef.current = false;
      setDragging(false);
      // Land on the exact pixel under the pointer before reporting, so the
      // released value never lags a frame behind the thumb.
      const r = ratioFromClientX(event.clientX);
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      pendingRef.current = null;
      const final = r ?? liveRef.current ?? committedRatio;
      publish(final);
      commitRef.current?.(clamp(fromRatioRef.current(final), min, max));
      settle();
    },
    [committedRatio, min, max, publish, ratioFromClientX, settle],
  );

  const stationIndex = useCallback(
    (target: number, direction: 1 | -1, offset = 0) => {
      const list = stationsRef.current;
      if (!list || list.length === 0) return null;
      let index: number | null = null;
      if (direction > 0) {
        index = list.length - 1;
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].at > target + EPS) {
            index = i;
            break;
          }
        }
      } else {
        index = 0;
        for (let i = list.length - 1; i >= 0; i -= 1) {
          if (list[i].at < target - EPS) {
            index = i;
            break;
          }
        }
      }
      return clamp(index + offset, 0, list.length - 1);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const list = stationsRef.current;
      const useStations = !!list && list.length > 0;
      const current = displayed;
      const currentRatio = clampRatio(toRatioRef.current(current));
      const at = (i: number) => fromRatioRef.current(list![i].at);
      let next: number | null = null;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown': {
          const i = useStations ? stationIndex(currentRatio, -1) : null;
          next = i === null ? current - step : at(i);
          break;
        }
        case 'ArrowRight':
        case 'ArrowUp': {
          const i = useStations ? stationIndex(currentRatio, 1) : null;
          next = i === null ? current + step : at(i);
          break;
        }
        case 'PageDown': {
          const i = useStations ? stationIndex(currentRatio, -1, -4) : null;
          next = i === null ? current - step * 10 : at(i);
          break;
        }
        case 'PageUp': {
          const i = useStations ? stationIndex(currentRatio, 1, 4) : null;
          next = i === null ? current + step * 10 : at(i);
          break;
        }
        case 'Home':
          next = useStations ? at(0) : fromRatioRef.current(0);
          break;
        case 'End':
          next = useStations
            ? at(list!.length - 1)
            : fromRatioRef.current(1);
          break;
        default:
          return;
      }

      event.preventDefault();
      const clamped = clamp(next, min, max);
      // Keyboard is discrete, so report it as a commit and let the parent
      // re-render drive the thumb. No tween.
      emitRef.current?.(clamped);
      commitRef.current?.(clamped);
      liveRef.current = null;
      setLiveRatio(null);
    },
    [displayed, disabled, max, min, stationIndex, step],
  );

  const percent = ratio * 100;
  const showLabel = (i: number, total: number) =>
    tickLabels === 'all' || (tickLabels === 'ends' && (i === 0 || i === total - 1));

  return (
    <div className={`select-none ${className}`}>
      {header}

      <div
        id={sliderId}
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(displayed.toFixed(2))}
        aria-valuetext={valueText(displayed)}
        aria-orientation="horizontal"
        aria-disabled={disabled || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        style={{ touchAction: 'none' }}
        className={`relative flex h-10 w-full items-center group ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-border" />
        <div
          className={`absolute h-[3px] rounded-full transition-[background-color] ${
            dragging ? 'bg-primary-hover' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />

        {stations?.map((s, i) => {
          const active = Math.abs(s.at - committedRatio) < 0.005;
          return (
            <span
              key={`${s.at}-${i}`}
              aria-hidden="true"
              // Centre explicitly rather than relying on the static position of
              // an absolutely positioned child of a flex container.
              className={`pointer-events-none absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 ${
                active ? 'bg-primary-foreground' : 'bg-border-hover'
              }`}
              style={{ left: `${s.at * 100}%` }}
            />
          );
        })}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2"
          style={{ left: `${percent}%` }}
        >
          {/* Solid fills only. Idle keeps a dark fill with a blue border so the
              thumb stays legible on top of the blue track fill; dragging
              inverts to a bright fill. */}
          <span
            className={`flex h-[22px] w-[3px] items-center justify-center rounded-full border transition-colors ${
              dragging
                ? 'border-primary-foreground bg-primary'
                : 'border-primary bg-surface group-hover:border-primary-hover'
            }`}
          >
            <span
              className={`h-[10px] w-[1px] rounded-full ${
                dragging ? 'bg-primary-foreground' : 'bg-primary'
              }`}
            />
          </span>
        </span>
      </div>

      {stations && tickLabels !== 'none' && (
        <div className="relative mt-1 h-4" aria-hidden="true">
          {stations.map((s, i) => {
            if (!showLabel(i, stations.length)) return null;
            const isFirst = i === 0;
            const isLast = i === stations.length - 1;
            // Only one of `left`/`right` may be set per label: giving the last
            // label both `right-0` and an inline `left` would stretch it across
            // the whole row and defeat the end-anchoring.
            const align = isFirst ? 'left-0' : isLast ? 'right-0' : '-translate-x-1/2';
            const style = isFirst || isLast ? undefined : { left: `${s.at * 100}%` };
            return (
              <span
                key={`label-${s.at}-${i}`}
                className={`absolute top-0 font-mono text-[10px] tabular-nums whitespace-nowrap ${
                  Math.abs(s.at - committedRatio) < 0.005
                    ? 'text-text-primary'
                    : 'text-text-muted'
                } ${align}`}
                style={style}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      )}

      {footer}
    </div>
  );
};

export default Scrubber;
