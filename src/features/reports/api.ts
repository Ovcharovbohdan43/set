import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

import {
  monthlyReportSchema,
  monthlyTrendSchema,
  spendingByCategorySchema,
  type MonthlyReport,
  type MonthlyTrend,
  type SpendingByCategory
} from './schema';

const monthlyReportListSchema = z.array(monthlyTrendSchema);
const spendingByCategoryListSchema = z.array(spendingByCategorySchema);

export async function fetchMonthlyReport(month: string): Promise<MonthlyReport> {
  const payload = await invoke<MonthlyReport>('get_monthly_report', { month });
  return monthlyReportSchema.parse(payload);
}

export async function fetchSpendingByCategory(
  startDate: string,
  endDate: string
): Promise<SpendingByCategory[]> {
  const payload = await invoke<SpendingByCategory[]>('get_spending_by_category', {
    startDate,
    endDate
  });
  return spendingByCategoryListSchema.parse(payload);
}

export async function fetchMonthlyTrend(months: number): Promise<MonthlyTrend[]> {
  const payload = await invoke<MonthlyTrend[]>('get_monthly_trend', { months });
  return monthlyReportListSchema.parse(payload);
}

export async function invalidateReportCache(keyPrefix?: string): Promise<void> {
  await invoke('invalidate_report_cache', { keyPrefix });
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  format: string;
}

const exportResultSchema = z.object({
  filePath: z.string(),
  fileName: z.string(),
  format: z.string()
});

export async function exportReportCsv(
  month: string,
  spendingByCategory: SpendingByCategory[]
): Promise<ExportResult> {
  const payload = await invoke<ExportResult>('export_report_csv', {
    month,
    spendingByCategory
  });
  return exportResultSchema.parse(payload);
}

export async function exportReportJson(
  month: string,
  report: MonthlyReport
): Promise<ExportResult> {
  const payload = await invoke<ExportResult>('export_report_json', {
    month,
    report
  });
  return exportResultSchema.parse(payload);
}

export async function exportReportEncryptedJson(
  month: string,
  report: MonthlyReport
): Promise<ExportResult> {
  const payload = await invoke<ExportResult>('export_report_encrypted_json', {
    month,
    report
  });
  return exportResultSchema.parse(payload);
}

export async function exportChartPng(
  chartType: string,
  month: string,
  chartDataBase64: string
): Promise<ExportResult> {
  const payload = await invoke<ExportResult>('export_chart_png', {
    chartType,
    month,
    chartDataBase64
  });
  return exportResultSchema.parse(payload);
}

