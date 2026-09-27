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

    if (showDifference && displayDifference.length > 0) {
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

    const xAxis: any[] = [
      {
        type: 'value',
        name: unit,
        nameLocation: 'middle',
        nameGap: compact ? 20 : 30,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
        min: Math.min(...displayObserved, ...displayModel) * 0.95,
        max: Math.max(...displayObserved, ...displayModel) * 1.05,
      },
    ];

    const yAxis: any[] = [
      {
        type: 'value',
        name: 'Depth (m)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor } },
        inverse: true,
        min: 0,
        max: Math.max(...displayDepth) * 1.05,
      },
    ];

    const grid: any[] = [
      {
        left: compact ? 40 : 50,
        right: showDifference ? 80 : 40,
        top: compact ? 10 : 30,
        bottom: 40,
        containLabel: true,
      },
    ];

    if (showDifference) {
      xAxis.push({
        type: 'value',
        name: `Diff (${unit})`,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: axisNameColor, fontSize: 10 },
        axisLabel: { color: axisLabelColor, fontSize: 10 },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        splitLine: { show: false },
        gridIndex: 1,
        position: 'top',
        offset: 0,
      });

      yAxis.push({
        type: 'value',
        inverse: true,
        min: 0,
        max: Math.max(...displayDepth) * 1.05,
        gridIndex: 1,
        show: false,
      });

      grid.push({
        left: compact ? 40 : 50,
        right: 40,
        top: compact ? 10 : 30,
        bottom: 40,
        containLabel: true,
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
        formatter: (params: any[]) => {
          const param = params[0];
          const paramDepth = param.value[1];
          const value = param.value[0];
          return `
            <div style="padding: 4px 0;">
              <div style="color: ${c.text.secondary}; font-size: 11px; margin-bottom: 4px;">Depth: ${paramDepth.toFixed(0)}m</div>
              <div style="color: ${observedColor};">● Observed: ${value.toFixed(2)}${unit}</div>
              <div style="color: ${modelColor};">○ Model: ${displayModel[param.dataIndex]?.toFixed(2)}${unit}</div>
              ${showDifference ? `<div style="color: ${displayDifference[param.dataIndex] >= 0 ? positiveDiff : negativeDiff};">▌ Difference: ${displayDifference[param.dataIndex]?.toFixed(2)}${unit}</div>` : ''}
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
