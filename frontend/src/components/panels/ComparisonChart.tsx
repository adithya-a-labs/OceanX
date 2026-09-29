import { useMemo } from 'react';
import EChartsReact from 'echarts-for-react';
import { useReducedMotion } from 'framer-motion';
import echarts from '../charts/echartsSetup';
import { oceanTokens } from '../../design-system';
import { getUnit } from '../../utils/formatters';
import type { ArgoComparison, AnimationEasing } from '../../types';

const c = oceanTokens.colors;

interface ComparisonChartProps {
  data: ArgoComparison;
  height: number;
  showDifference?: boolean;
  compact?: boolean;
}

export const ComparisonChart = ({
  data,
  height,
  showDifference = true,
  compact = false,
}: ComparisonChartProps) => {
  const prefersReducedMotion = useReducedMotion();
  const animate = !compact && !prefersReducedMotion;

  const options = useMemo(() => {
    const { depth, observed, model, difference, variable } = data;
    const unit = getUnit(variable);

    // Only keep levels where depth and both series are present and finite. A
    // partially written asset would otherwise place NaN on the axis and collapse
    // the whole plot, and an entirely empty series would produce -Infinity
    // bounds that ECharts cannot render.
    const rows = depth
      .map((d, i) => ({ depth: d, observed: observed[i], model: model[i], difference: difference[i] }))
      .filter(r =>
        Number.isFinite(r.depth) &&
        Number.isFinite(r.observed) &&
        Number.isFinite(r.model));
    if (rows.length === 0) return null;

    const displayRows = [...rows].reverse(); // surface at top
    const displayDepth = displayRows.map(r => r.depth);
    const displayObserved = displayRows.map(r => r.observed as number);
    const displayModel = displayRows.map(r => r.model as number);
    // Difference stays index-aligned with the profile rows so the tooltip can
    // read a matching depth; levels without a finite difference are dropped as
    // value/depth pairs rather than as bare values, which would shift the bars
    // off their depths.
    const differencePairs = showDifference
      ? displayRows
        .map((r, i) => [r.difference, displayDepth[i]] as const)
        .filter((pair): pair is readonly [number, number] => Number.isFinite(pair[0]))
      : [];

    const observedColor = c.observed;
    const modelColor = c.model;
    const positiveDiff = c.success;
    const negativeDiff = c.error;
    const axisLabelColor = c.text.muted;
    const axisNameColor = c.text.secondary;
    const axisLineColor = c.border;
    // Flat tokens instead of hand-tuned rgba: the zero/split line needs to read
    // slightly stronger than the axis, so it uses the next border step.
    const splitLineColor = c.borderHover;
    const surfaceTint = c.overlay;

    const hasDifference = differencePairs.length > 0;
    const depthMax = Math.max(...displayDepth) * 1.05;

    // Pad by the data range rather than scaling the extremes: scaling breaks for
    // negative values, where min * 0.95 moves the bound toward zero and pushes
    // the data point itself off the axis.
    const valueLow = Math.min(...displayObserved, ...displayModel);
    const valueHigh = Math.max(...displayObserved, ...displayModel);
    const valuePad = (valueHigh - valueLow) * 0.08 || 1;
    const valueMin = valueLow - valuePad;
    const valueMax = valueHigh + valuePad;

    const xAxis: any[] = [];
    const yAxis: any[] = [];
    const grid: any[] = [];

    // Shared depth axis: both plots must span the exact same range, otherwise the
    // difference bars drift out of register with the profile lines above them.
    const depthAxis = (gridIndex: number) => ({
      type: 'value',
      inverse: true,
      min: 0,
      max: depthMax,
      gridIndex,
    });

    if (!hasDifference) {
      // Single plot. Labels are auto-contained, so the axis gutters stay implicit.
      xAxis.push({
        type: 'value',
        name: unit,
        nameLocation: 'middle',
        nameGap: compact ? 20 : 30,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
        min: valueMin,
        max: valueMax,
      });

      yAxis.push({
        ...depthAxis(0),
        name: 'Depth (m)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
      });

      grid.push({
        left: compact ? 40 : 50,
        right: 40,
        top: compact ? 10 : 30,
        bottom: 40,
        containLabel: true,
      });
    } else {
      // Two stacked plots sharing the depth axis: the profile on top, the
      // difference strip underneath. Previously both grids used the same top and
      // bottom, so the difference bars were drawn straight over the profile lines.
      //
      // Vertical budget, outside the plot areas:
      //   topPad    legend, plus the profile axis drawn above its plot
      //   gap       breathing room between the two plots
      //   bottomPad the difference axis labels and unit, drawn below its plot
      const hasLegend = !compact;
      const topPad = hasLegend ? 46 : 22;
      const gap = 8;
      const bottomPad = 30;
      const usable = Math.max(64, height - topPad - gap - bottomPad);
      const profileHeight = Math.round(usable * 0.6);
      const differenceHeight = usable - profileHeight;

      // Fixed gutters rather than containLabel: both plots then start their
      // series at the identical x, so the bars line up under the profile.
      const left = 52;
      const right = 12;

      // Symmetric around zero so the sign colours actually mean something, and
      // so the bars grow from a visible zero baseline.
      const maxAbsDifference = Math.max(0, ...differencePairs.map(([v]) => Math.abs(v)));
      const differenceLimit = maxAbsDifference > 0 ? maxAbsDifference * 1.15 : 1;

      xAxis.push({
        type: 'value',
        position: 'top',
        gridIndex: 0,
        name: unit,
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
        min: valueMin,
        max: valueMax,
      });

      yAxis.push({
        ...depthAxis(0),
        name: 'Depth (m)',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
      });

      grid.push({ left, right, top: topPad, height: profileHeight, containLabel: false });

      xAxis.push({
        type: 'value',
        position: 'bottom',
        gridIndex: 1,
        name: `Diff (${unit})`,
        nameLocation: 'middle',
        nameGap: 16,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: {
          color: axisLabelColor,
          fontSize: 10,
          formatter: (v: number) => v.toFixed(2),
        },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { show: false },
        min: -differenceLimit,
        max: differenceLimit,
      });

      yAxis.push({ ...depthAxis(1), show: false });

      grid.push({
        left,
        right,
        top: topPad + profileHeight + gap,
        height: differenceHeight,
        containLabel: false,
      });
    }

    const series: any[] = [
      {
        name: 'Observed',
        type: 'line',
        data: displayObserved.map((v, i) => [v, displayDepth[i]]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: observedColor },
        encode: { x: 0, y: 1 },
      },
      {
        name: 'Model',
        type: 'line',
        data: displayModel.map((v, i) => [v, displayDepth[i]]),
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        lineStyle: { width: 2, type: 'dashed' },
        itemStyle: { color: modelColor },
        encode: { x: 0, y: 1 },
      },
    ];

    if (hasDifference) {
      series.push({
        name: 'Difference',
        type: 'bar',
        data: differencePairs.map(([v, d]) => [v, d]),
        barWidth: '30%',
        itemStyle: {
          color: (params: any) => (params.value[0] >= 0 ? positiveDiff : negativeDiff),
        },
        xAxisIndex: 1,
        yAxisIndex: 1,
        encode: { x: 0, y: 1 },
      });
    }

    return {
      animation: animate,
      animationDuration: 500,
      animationEasing: 'cubicOut' as AnimationEasing,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: c.info } },
        backgroundColor: surfaceTint,
        borderColor: axisLineColor,
        borderWidth: 1,
        textStyle: { color: c.text.primary },
        formatter: (params: any) => {
          // The axis trigger only collects series belonging to the grid the
          // pointer is in. Hovering the difference strip therefore omits Observed
          // and Model entirely, so reading a row out of one fixed param would
          // mix depths. All three series are built from the same reversed depth
          // order, so whichever series is present pins the shared index, and
          // every value is then read from that one row.
          const list = Array.isArray(params) ? params : [params];
          const pick = (name: string) => list.find((p: any) => p.seriesName === name);
          const anchor = pick('Difference') ?? pick('Observed') ?? pick('Model');
          if (!anchor) return '';

          const index = anchor.dataIndex ?? 0;
          const paramDepth = Number(displayDepth[index] ?? 0);
          const observedValue = displayObserved[index];
          const modelValue = displayModel[index];
          const differenceValue = displayRows[index]?.difference;

          return `
            <div style="padding: 4px 0;">
              <div style="color: ${c.text.secondary}; font-size: 11px; margin-bottom: 4px;">Depth: ${Number(paramDepth).toFixed(0)}m</div>
              <div style="color: ${observedColor};">● Observed: ${Number(observedValue).toFixed(2)}${unit}</div>
              <div style="color: ${modelColor};">○ Model: ${Number(modelValue).toFixed(2)}${unit}</div>
              ${
                Number.isFinite(differenceValue)
                  ? `<div style="color: ${Number(differenceValue) >= 0 ? positiveDiff : negativeDiff};">▌ Difference: ${Number(differenceValue).toFixed(2)}${unit}</div>`
                  : ''
              }
            </div>
          `;
        },
      },
      legend: {
        show: !compact,
        top: 0,
        left: 'center',
        textStyle: { color: c.text.secondary, fontSize: 11 },
        itemWidth: 16,
        itemHeight: 8,
      },
      grid,
      xAxis,
      yAxis,
      series,
    };
  }, [data, height, showDifference, compact, animate]);

  if (!options) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm text-text-muted"
        role="status"
      >
        No comparable levels in this profile.
      </div>
    );
  }

  const rmseLabel = Number.isFinite(data.rmse) ? ` with RMSE ${data.rmse.toFixed(3)}` : '';

  return (
    <EChartsReact
      echarts={echarts}
      option={options}
      notMerge
      opts={{ renderer: 'canvas' }}
      style={{ width: '100%', height }}
      role="img"
      aria-label={`Comparison chart for ${data.variable} showing observed vs model${rmseLabel}`}
    />
  );
};

export default ComparisonChart;
