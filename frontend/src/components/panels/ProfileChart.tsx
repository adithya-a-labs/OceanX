import { useMemo } from 'react';
import EChartsReact from 'echarts-for-react';
import { useReducedMotion } from 'framer-motion';
import echarts from '../charts/echartsSetup';
import { oceanTokens } from '../../design-system';
import { getUnit } from '../../utils/formatters';
import type { AnimationEasing, DemoArgoProfile, LayerVariable } from '../../types';

/** Observation-only profile plot: value against depth, surface at the top. */
interface ProfileChartProps {
  profile: DemoArgoProfile;
  variable: LayerVariable;
  height?: number;
  compact?: boolean;
}

const c = oceanTokens.colors;

// The profile chart draws a single observed Argo series, so both variables use
// the same functional observed colour rather than a per-variable hue.
const SERIES_COLORS: Record<LayerVariable, string> = {
  temperature: c.observed,
  salinity: c.observed,
};

const VARIABLE_LABELS: Record<LayerVariable, string> = {
  temperature: 'Temperature',
  salinity: 'Salinity',
};

export const ProfileChart = ({
  profile,
  variable,
  height = 160,
  compact = false,
}: ProfileChartProps) => {
  const prefersReducedMotion = useReducedMotion();
  const animate = !compact && !prefersReducedMotion;
  const unit = getUnit(variable);

  // Salinity is nullable in the source files: a level that failed QC is null and
  // must break the line rather than be drawn as zero.
  const values = variable === 'temperature' ? profile.temperatureDegC : profile.salinity;

  const points = useMemo(
    () => profile.depthM
      .map((depth, i) => ({ depth, value: values[i] }))
      .filter((p): p is { depth: number; value: number } =>
        p.value !== null && p.value !== undefined && Number.isFinite(p.value)),
    [profile.depthM, values],
  );

  const options = useMemo(() => {
    if (points.length === 0) return null;

    // Reversed for display so the surface sits at the top of the depth axis.
    const ordered = [...points].reverse();
    const valueLow = Math.min(...ordered.map(p => p.value));
    const valueHigh = Math.max(...ordered.map(p => p.value));
    const valuePad = (valueHigh - valueLow) * 0.08 || 1;
    const depthMax = Math.max(...ordered.map(p => p.depth)) * 1.02;
    const color = SERIES_COLORS[variable];
    const label = VARIABLE_LABELS[variable];

    return {
      animation: animate,
      animationDuration: 450,
      animationEasing: 'cubicOut' as AnimationEasing,
      backgroundColor: 'transparent',
      grid: {
        left: compact ? 38 : 50,
        right: compact ? 10 : 16,
        top: compact ? 8 : 16,
        bottom: compact ? 20 : 32,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: c.info } },
        backgroundColor: 'rgba(12, 74, 110, 0.95)',
        borderColor: c.border,
        borderWidth: 1,
        textStyle: { color: c.text.primary, fontSize: 11 },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const point = list[0] as { value?: [number, number] } | undefined;
          if (!point?.value) return '';
          const [value, depth] = point.value;
          return `<div style="padding: 2px 0;">
            <div style="color: ${c.text.secondary}; font-size: 11px; margin-bottom: 2px;">
              Depth: ${Number(depth).toFixed(0)} m
            </div>
            <div style="color: ${color};">● ${label}: ${Number(value).toFixed(2)} ${unit}</div>
          </div>`;
        },
      },
      xAxis: {
        type: 'value',
        name: compact ? undefined : unit,
        nameLocation: 'middle',
        nameGap: compact ? 12 : 26,
        nameTextStyle: { color: c.ocean[200], fontSize: 10 },
        axisLabel: { color: c.text.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: c.border } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(30, 58, 95, 0.5)' } },
        min: valueLow - valuePad,
        max: valueHigh + valuePad,
      },
      yAxis: {
        type: 'value',
        inverse: true,
        name: compact ? undefined : 'Depth (m)',
        nameLocation: 'middle',
        nameGap: compact ? 30 : 36,
        nameTextStyle: { color: c.ocean[200], fontSize: 10 },
        axisLabel: { color: c.text.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: c.border } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(30, 58, 95, 0.5)' } },
        min: 0,
        max: depthMax,
      },
      series: [
        {
          name: `Argo ${label}`,
          type: 'line',
          data: ordered.map(p => [p.value, p.depth]),
          showSymbol: false,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: { color: `${color}22` },
        },
      ],
    };
  }, [points, variable, unit, compact, animate]);

  if (!options) return null;

  return (
    <EChartsReact
      echarts={echarts}
      option={options}
      notMerge
      opts={{ renderer: 'canvas' }}
      style={{ width: '100%', height }}
      role="img"
      aria-label={`Argo ${VARIABLE_LABELS[variable]} profile against depth, ${points.length} valid levels`}
    />
  );
};

export default ProfileChart;
