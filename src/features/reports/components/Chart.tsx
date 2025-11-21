import { useEffect, useRef } from 'react';

import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  type BarSeriesOption,
  type LineSeriesOption,
  type PieSeriesOption
} from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
  type TitleComponentOption
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register components
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | TitleComponentOption
>;

interface ChartProps {
  option: EChartsOption;
  className?: string;
  height?: number | string;
  loading?: boolean;
  onChartReady?: (chart: echarts.ECharts) => void;
}

export function Chart({
  option,
  className = '',
  height = 400,
  loading = false,
  onChartReady
}: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
      if (onChartReady) {
        onChartReady(chartInstanceRef.current);
      }
    }

    const chart = chartInstanceRef.current;

    // Set option
    chart.setOption(option, true);

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option, onChartReady]);

  useEffect(() => {
    if (chartInstanceRef.current) {
      if (loading) {
        chartInstanceRef.current.showLoading();
      } else {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [loading]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

export function getChartInstance(chartRef: React.RefObject<HTMLDivElement>): echarts.ECharts | null {
  if (!chartRef.current) return null;
  return echarts.getInstanceByDom(chartRef.current) || null;
}

export async function exportChartAsPng(chart: echarts.ECharts): Promise<string> {
  const dataUrl = chart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  });
  
  // Extract base64 data from data URL
  const base64 = dataUrl.split(',')[1];
  return base64;
}

