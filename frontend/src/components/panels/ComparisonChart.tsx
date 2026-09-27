import { useMemo } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import EChartsReact from 'echarts-for-react';
import { useReducedMotion } from 'framer-motion';
import { oceanTokens } from '../../design-system';
import type { ArgoComparison, AnimationEasing } from '../../types';

// Register required ECharts components
// Axis is built into echarts core, no need to import separately
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  CanvasRenderer,
]);

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
    const unit = variable === 'salinity' ? 'PSU' : variable === 'temperature' ? '°C' : 'm/s';

    const observedColor = c.salinity.gradient[1]; // cyan
    const modelColor = c.accent.DEFAULT; // orange
    const positiveDiff = c.success;
    const negativeDiff = c.error;
    const axisLabelColor = c.text.muted;
    const axisNameColor = c.ocean[200];
    const axisLineColor = c.border;
    const splitLineColor = 'rgba(30, 58, 95, 0.5)'; // 50% of colors.border
    const surfaceTint = 'rgba(12, 74, 110, 0.95)'; // 95% of colors.surface

    // Reverse depth for display (surface at top)
    const displayDepth = [...depth].reverse();
    const displayObserved = [...observed].reverse();
    const displayModel = [...model].reverse();
    const displayDifference = showDifference ? [...difference].reverse() : [];

    const hasDifference = showDifference && displayDifference.length > 0;
    const depthMax = Math.max(...displayDepth) * 1.05;
    const valueMin = Math.min(...displayObserved, ...displayModel) * 0.95;
    const valueMax = Math.max(...displayObserved, ...displayModel) * 1.05;

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
      const maxAbsDifference = Math.max(0, ...displayDifference.map((v) => Math.abs(v)));
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
        data: displayDifference.map((v, i) => [v, displayDepth[i]]),
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
          // With two value axes on one axis trigger, params[0] is whichever
          // series ECharts happens to order first. Look each one up by name.
          const list = Array.isArray(params) ? params : [params];
          const pick = (name: string) => list.find((p: any) => p.seriesName === name);
          const observedPoint = pick('Observed');
          const modelPoint = pick('Model');
          const differencePoint = pick('Difference');

          const index = observedPoint?.dataIndex ?? modelPoint?.dataIndex ?? 0;
          const paramDepth = observedPoint?.value?.[1] ?? modelPoint?.value?.[1] ?? 0;
          const observedValue = observedPoint?.value?.[0] ?? displayObserved[index];
          const modelValue = modelPoint?.value?.[0] ?? displayModel[index];
          const differenceValue = differencePoint?.value?.[0] ?? displayDifference[index];

          return `
            <div style="padding: 4px 0;">
              <div style="color: ${c.text.secondary}; font-size: 11px; margin-bottom: 4px;">Depth: ${Number(paramDepth).toFixed(0)}m</div>
              <div style="color: ${observedColor};">● Observed: ${Number(observedValue).toFixed(2)}${unit}</div>
              <div style="color: ${modelColor};">○ Model: ${Number(modelValue).toFixed(2)}${unit}</div>
              ${
                hasDifference
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

  return (
    <EChartsReact
      echarts={echarts}
      option={options}
      notMerge
      opts={{ renderer: 'canvas' }}
      style={{ width: '100%', height }}
      role="img"
      aria-label={`Comparison chart for ${data.variable} showing observed vs model with RMSE ${data.rmse.toFixed(3)}`}
    />
  );
};

export default ComparisonChart;
