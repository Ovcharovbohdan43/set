import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { monthlyReportSchema, monthlyTrendSchema, spendingByCategorySchema } from './schema';
const monthlyReportListSchema = z.array(monthlyTrendSchema);
const spendingByCategoryListSchema = z.array(spendingByCategorySchema);
export async function fetchMonthlyReport(month) {
    const payload = await invoke('get_monthly_report', { month });
    return monthlyReportSchema.parse(payload);
}
export async function fetchSpendingByCategory(startDate, endDate) {
    const payload = await invoke('get_spending_by_category', {
        startDate,
        endDate
    });
    return spendingByCategoryListSchema.parse(payload);
}
export async function fetchMonthlyTrend(months) {
    const payload = await invoke('get_monthly_trend', { months });
    return monthlyReportListSchema.parse(payload);
}
export async function invalidateReportCache(keyPrefix) {
    await invoke('invalidate_report_cache', { keyPrefix });
}
const exportResultSchema = z.object({
    filePath: z.string(),
    fileName: z.string(),
    format: z.string()
});
export async function exportReportCsv(month, spendingByCategory) {
    const payload = await invoke('export_report_csv', {
        month,
        spendingByCategory
    });
    return exportResultSchema.parse(payload);
}
export async function exportReportJson(month, report) {
    const payload = await invoke('export_report_json', {
        month,
        report
    });
    return exportResultSchema.parse(payload);
}
export async function exportReportEncryptedJson(month, report) {
    const payload = await invoke('export_report_encrypted_json', {
        month,
        report
    });
    return exportResultSchema.parse(payload);
}
export async function exportChartPng(chartType, month, chartDataBase64) {
    const payload = await invoke('export_chart_png', {
        chartType,
        month,
        chartDataBase64
    });
    return exportResultSchema.parse(payload);
}
