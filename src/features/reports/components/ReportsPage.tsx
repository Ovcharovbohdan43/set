import { useMemo, useRef, useState } from 'react';

import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';

import { formatCurrency, formatMonth, getCurrentMonth, getMonthDateRange, getNextMonth, getPreviousMonth } from '../utils';
import { Chart } from './Chart';
import { ExportButton } from './ExportButton';
import {
  useMonthlyReport,
  useMonthlyTrend,
  useReportsInvalidation
} from '../hooks';

export function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  useReportsInvalidation();

  const { data: monthlyReport, isLoading: isLoadingReport } = useMonthlyReport(selectedMonth);
  const { data: monthlyTrend, isLoading: isLoadingTrend } = useMonthlyTrend(12);

  // Chart instances for export
  const spendingChartRef = useRef<echarts.ECharts | null>(null);
  const incomeExpenseChartRef = useRef<echarts.ECharts | null>(null);
  const trendChartRef = useRef<echarts.ECharts | null>(null);
  const budgetChartRef = useRef<echarts.ECharts | null>(null);

  // Spending by Category Pie Chart
  const spendingByCategoryOption = useMemo<EChartsCoreOption>(() => {
    if (!monthlyReport) {
      return {};
    }

    const topCategories = monthlyReport.spendingByCategory.slice(0, 10);
    const otherAmount = monthlyReport.spendingByCategory
      .slice(10)
      .reduce((sum, cat) => sum + cat.amountCents, 0);

    const data = [
      ...topCategories.map((cat) => ({
        name: cat.categoryName,
        value: cat.amountCents
      })),
      ...(otherAmount > 0
        ? [
            {
              name: 'Other',
              value: otherAmount
            }
          ]
        : [])
    ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const value = params.value as number;
          const percent = params.percent as number;
          return `${params.name}<br/>${formatCurrency(value)} (${percent.toFixed(1)}%)`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: 'Spending',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data
        }
      ]
    };
  }, [monthlyReport]);

  // Monthly Trend Line Chart
  const monthlyTrendOption = useMemo<EChartsCoreOption>(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) {
      return {};
    }

    const months = monthlyTrend.map((t) => t.month);
    const income = monthlyTrend.map((t) => t.incomeCents);
    const expenses = monthlyTrend.map((t) => t.expenseCents);
    const net = monthlyTrend.map((t) => t.netCents);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params[0] : params;
          const month = data.axisValue as string;
          const incomeVal = income[months.indexOf(month)] || 0;
          const expenseVal = expenses[months.indexOf(month)] || 0;
          const netVal = net[months.indexOf(month)] || 0;
          return `${formatMonth(month)}<br/>
            Income: ${formatCurrency(incomeVal)}<br/>
            Expenses: ${formatCurrency(expenseVal)}<br/>
            Net: ${formatCurrency(netVal)}`;
        }
      },
      legend: {
        data: ['Income', 'Expenses', 'Net']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value)
        }
      },
      series: [
        {
          name: 'Income',
          type: 'line',
          data: income,
          smooth: true,
          lineStyle: {
            color: '#10b981'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
              ]
            }
          }
        },
        {
          name: 'Expenses',
          type: 'line',
          data: expenses,
          smooth: true,
          lineStyle: {
            color: '#ef4444'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
              ]
            }
          }
        },
        {
          name: 'Net',
          type: 'line',
          data: net,
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            type: 'dashed'
          }
        }
      ]
    };
  }, [monthlyTrend]);

  // Income vs Expense Bar Chart
  const incomeVsExpenseOption = useMemo<EChartsCoreOption>(() => {
    if (!monthlyReport) {
      return {};
    }

    const { incomeCents, expenseCents, netCents } = monthlyReport.incomeVsExpense;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params : [params];
          return data
            .map((p: any) => `${p.seriesName}: ${formatCurrency(p.value as number)}`)
            .join('<br/>');
        }
      },
      legend: {
        data: ['Income', 'Expenses', 'Net']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [formatMonth(selectedMonth)]
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value)
        }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: [incomeCents],
          itemStyle: {
            color: '#10b981'
          }
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: [expenseCents],
          itemStyle: {
            color: '#ef4444'
          }
        },
        {
          name: 'Net',
          type: 'bar',
          data: [netCents],
          itemStyle: {
            color: netCents >= 0 ? '#3b82f6' : '#f59e0b'
          }
        }
      ]
    };
  }, [monthlyReport, selectedMonth]);

  // Budget Progress Bar Chart
  const budgetProgressOption = useMemo<EChartsCoreOption>(() => {
    if (!monthlyReport || monthlyReport.budgetSummaries.length === 0) {
      return {};
    }

    const budgets = monthlyReport.budgetSummaries;
    const names = budgets.map((b) => b.budgetName);
    const targets = budgets.map((b) => b.targetCents);
    const spent = budgets.map((b) => b.spentCents);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params : [params];
          return data
            .map((p: any) => {
              const index = names.indexOf(p.axisValue as string);
              const budget = budgets[index];
              if (!budget) {
                return `${p.seriesName}: ${formatCurrency(p.value as number)}`;
              }
              return `${p.seriesName}: ${formatCurrency(p.value as number)}<br/>
                Progress: ${budget.progressPercent.toFixed(1)}%`;
            })
            .join('<br/>');
        }
      },
      legend: {
        data: ['Target', 'Spent']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value)
        }
      },
      series: [
        {
          name: 'Target',
          type: 'bar',
          data: targets,
          itemStyle: {
            color: '#94a3b8'
          }
        },
        {
          name: 'Spent',
          type: 'bar',
          data: spent,
          itemStyle: {
            color: '#3b82f6'
          }
        }
      ]
    };
  }, [monthlyReport]);

  const handlePreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Financial insights and visualizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {monthlyReport && (
            <ExportButton
              month={selectedMonth}
              report={monthlyReport}
              spendingByCategory={monthlyReport.spendingByCategory.map(cat => ({
                ...cat,
                transactionCount: 0 // TODO: Add transactionCount from backend
              }))}
            />
          )}
          <button
            onClick={handlePreviousMonth}
            disabled={isLoadingReport}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            ← Previous
          </button>
          <div className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            {formatMonth(selectedMonth)}
          </div>
          <button
            onClick={handleNextMonth}
            disabled={isLoadingReport || selectedMonth >= getCurrentMonth()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spending by Category */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Spending by Category
            </h2>
            <ExportButton
              month={selectedMonth}
              chartInstance={spendingChartRef.current}
              chartType="spending-by-category"
            />
          </div>
          <Chart
            option={spendingByCategoryOption}
            loading={isLoadingReport}
            height={400}
            className="w-full"
            onChartReady={(chart) => {
              spendingChartRef.current = chart;
            }}
          />
        </div>

        {/* Income vs Expense */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Income vs Expenses
            </h2>
            <ExportButton
              month={selectedMonth}
              chartInstance={incomeExpenseChartRef.current}
              chartType="income-vs-expense"
            />
          </div>
          <Chart
            option={incomeVsExpenseOption}
            loading={isLoadingReport}
            height={400}
            className="w-full"
            onChartReady={(chart) => {
              incomeExpenseChartRef.current = chart;
            }}
          />
        </div>

        {/* Monthly Trend */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              12-Month Trend
            </h2>
            <ExportButton
              month={selectedMonth}
              chartInstance={trendChartRef.current}
              chartType="monthly-trend"
            />
          </div>
          <Chart
            option={monthlyTrendOption}
            loading={isLoadingTrend}
            height={400}
            className="w-full"
            onChartReady={(chart) => {
              trendChartRef.current = chart;
            }}
          />
        </div>

        {/* Budget Progress */}
        {monthlyReport && monthlyReport.budgetSummaries.length > 0 && (
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Budget Progress
              </h2>
              <ExportButton
                month={selectedMonth}
                chartInstance={budgetChartRef.current}
                chartType="budget-progress"
              />
            </div>
            <Chart
              option={budgetProgressOption}
              loading={isLoadingReport}
              height={400}
              className="w-full"
              onChartReady={(chart) => {
                budgetChartRef.current = chart;
              }}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {monthlyReport && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(monthlyReport.incomeVsExpense.incomeCents)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(monthlyReport.incomeVsExpense.expenseCents)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                monthlyReport.incomeVsExpense.netCents >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {formatCurrency(monthlyReport.incomeVsExpense.netCents)}
            </p>
          </div>
        </div>
      )}

      {/* Forecast Card */}
      {monthlyReport?.forecast && (
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            Next Month Forecast
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Projected Income</p>
              <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(monthlyReport.forecast.nextMonthIncome)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Projected Expenses</p>
              <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(monthlyReport.forecast.nextMonthExpense)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Confidence</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                {(monthlyReport.forecast.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

