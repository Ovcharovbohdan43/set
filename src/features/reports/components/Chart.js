import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, TitleComponent } from 'echarts/components';
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
export function Chart({ option, className = '', height = 400, loading = false, onChartReady }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current)
            return;
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
            }
            else {
                chartInstanceRef.current.hideLoading();
            }
        }
    }, [loading]);
    return (_jsx("div", { ref: chartRef, className: className, style: { height: typeof height === 'number' ? `${height}px` : height } }));
}
export function getChartInstance(chartRef) {
    if (!chartRef.current)
        return null;
    return echarts.getInstanceByDom(chartRef.current) || null;
}
export async function exportChartAsPng(chart) {
    const dataUrl = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
    });
    // Extract base64 data from data URL
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
        throw new Error('Failed to extract base64 data from chart');
    }
    return base64;
}
