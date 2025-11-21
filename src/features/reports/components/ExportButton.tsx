import { useState } from 'react';

import * as echarts from 'echarts/core';

import {
  exportChartPng,
  exportReportCsv,
  exportReportEncryptedJson,
  exportReportJson
} from '../api';
import { exportChartAsPng } from './Chart';
import type { MonthlyReport, SpendingByCategory } from '../schema';

interface ExportButtonProps {
  month: string;
  report?: MonthlyReport;
  chartInstance?: echarts.ECharts | null;
  chartType?: string;
  spendingByCategory?: SpendingByCategory[];
}

export function ExportButton({
  month,
  report,
  chartInstance,
  chartType,
  spendingByCategory
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportCsv = async () => {
    if (!spendingByCategory || spendingByCategory.length === 0) {
      alert('No spending data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportReportCsv(month, spendingByCategory);
      alert(`Report exported successfully!\nFile: ${result.fileName}\nPath: ${result.filePath}`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportJson = async () => {
    if (!report) {
      alert('No report data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportReportJson(month, report);
      alert(`Report exported successfully!\nFile: ${result.fileName}\nPath: ${result.filePath}`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportEncryptedJson = async () => {
    if (!report) {
      alert('No report data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportReportEncryptedJson(month, report);
      alert(`Encrypted report exported successfully!\nFile: ${result.fileName}\nPath: ${result.filePath}`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportPng = async () => {
    if (!chartInstance || !chartType) {
      alert('Chart not available for export');
      return;
    }

    setIsExporting(true);
    try {
      const base64 = await exportChartAsPng(chartInstance);
      const result = await exportChartPng(chartType, month, base64);
      alert(`Chart exported successfully!\nFile: ${result.fileName}\nPath: ${result.filePath}`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {chartInstance && chartType && (
              <button
                onClick={handleExportPng}
                className="w-full rounded-t-lg px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Export Chart as PNG
              </button>
            )}
            {spendingByCategory && spendingByCategory.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Export as CSV
              </button>
            )}
            {report && (
              <>
                <button
                  onClick={handleExportJson}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Export as JSON
                </button>
                <button
                  onClick={handleExportEncryptedJson}
                  className="w-full rounded-b-lg px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Export as Encrypted JSON
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

