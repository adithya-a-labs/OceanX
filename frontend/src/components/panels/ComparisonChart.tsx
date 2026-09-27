import { useRef, useEffect, useMemo } from 'react';
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
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const options = useMemo(() => {
    const { depth, observed, model, difference, variable } = data;
    const unit = variable === 'salinity' ? 'PSU' : variable === 'temperature' ? '°C' : 'm/s';

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
        itemStyle: { color: '#22d3ee' },
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
        itemStyle: { color: '#f97316' },
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
          color: (params: any) => (params.value[0] >= 0 ? '#22c55e' : '#ef4444'),
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
        nameTextStyle: { color: '#7dd3fc', fontSize: 10 },
        axisLabel: { color: '#7dd3fc', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1e3a5f' } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(30, 58, 95, 0.5)' } },
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
        nameTextStyle: { color: '#7dd3fc', fontSize: 10 },
        axisLabel: { color: '#7dd3fc', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1e3a5f' } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(30, 58, 95, 0.5)' } },
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
        nameTextStyle: { color: '#7dd3fc', fontSize: 10 },
        axisLabel: { color: '#7dd3fc', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1e3a5f' } },
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
      animation: !compact,
      animationDuration: 500,
      animationEasing: 'cubicOut' as AnimationEasing,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#38bdf8' } },
        backgroundColor: 'rgba(12, 74, 110, 0.95)',
        borderColor: '#1e3a5f',
        borderWidth: 1,
        textStyle: { color: '#f0f9ff' },
        formatter: (params: any[]) => {
          const param = params[0];
          const depth = param.value[1];
          const value = param.value[0];
          return `
            <div style="padding: 4px 0;">
              <div style="color: #bae6fd; font-size: 11px; margin-bottom: 4px;">Depth: ${depth.toFixed(0)}m</div>
              <div style="color: #22d3ee;">● Observed: ${value.toFixed(2)}${unit}</div>
              <div style="color: #f97316;">○ Model: ${displayModel[param.dataIndex]?.toFixed(2)}${unit}</div>
              ${showDifference ? `<div style="color: ${displayDifference[param.dataIndex] >= 0 ? '#22c55e' : '#ef4444'};">▌ Difference: ${displayDifference[param.dataIndex]?.toFixed(2)}${unit}</div>` : ''}
            </div>
          `;
        },
      },
      legend: {
        show: !compact,
        top: 0,
        left: 'center',
        textStyle: { color: '#bae6fd', fontSize: 11 },
        itemWidth: 16,
        itemHeight: 8,
      },
      grid,
      xAxis,
      yAxis,
      series,
    };
  }, [data, height, showDifference, compact]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current, null, {
      renderer: 'canvas',
      width: '100%',
      height,
    });

    chartInstance.current.setOption(options, true);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [options, height]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height }}
      className="w-full"
      role="img"
      aria-label={`Comparison chart for ${data.variable} showing observed vs model with RMSE ${data.rmse.toFixed(3)}`}
    />
  );
};

export default ComparisonChart;