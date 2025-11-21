import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from 'react';
import { formatCurrency, formatMonth, getCurrentMonth, getNextMonth, getPreviousMonth } from '../utils';
import { Chart } from './Chart';
import { ExportButton } from './ExportButton';
import { useMonthlyReport, useMonthlyTrend, useReportsInvalidation } from '../hooks';
export function ReportsPage() {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    useReportsInvalidation();
    const { data: monthlyReport, isLoading: isLoadingReport } = useMonthlyReport(selectedMonth);
    const { data: monthlyTrend, isLoading: isLoadingTrend } = useMonthlyTrend(12);
    // Chart instances for export
    const spendingChartRef = useRef(null);
    const incomeExpenseChartRef = useRef(null);
    const trendChartRef = useRef(null);
    const budgetChartRef = useRef(null);
    // Spending by Category Pie Chart
    const spendingByCategoryOption = useMemo(() => {
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
                formatter: (params) => {
                    const value = params.value;
                    const percent = params.percent;
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
    const monthlyTrendOption = useMemo(() => {
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
                formatter: (params) => {
                    const data = Array.isArray(params) ? params[0] : params;
                    const month = data.axisValue;
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
                    formatter: (value) => formatCurrency(value)
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
    const incomeVsExpenseOption = useMemo(() => {
        if (!monthlyReport) {
            return {};
        }
        const { incomeCents, expenseCents, netCents } = monthlyReport.incomeVsExpense;
        return {
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    const data = Array.isArray(params) ? params : [params];
                    return data
                        .map((p) => `${p.seriesName}: ${formatCurrency(p.value)}`)
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
                    formatter: (value) => formatCurrency(value)
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
    const budgetProgressOption = useMemo(() => {
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
                formatter: (params) => {
                    const data = Array.isArray(params) ? params : [params];
                    return data
                        .map((p) => {
                        const index = names.indexOf(p.axisValue);
                        const budget = budgets[index];
                        if (!budget) {
                            return `${p.seriesName}: ${formatCurrency(p.value)}`;
                        }
                        return `${p.seriesName}: ${formatCurrency(p.value)}<br/>
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
                    formatter: (value) => formatCurrency(value)
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white", children: "Reports & Analytics" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Financial insights and visualizations" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [monthlyReport && (_jsx(ExportButton, { month: selectedMonth, report: monthlyReport, spendingByCategory: monthlyReport.spendingByCategory.map(cat => ({
                                    ...cat,
                                    transactionCount: 0 // TODO: Add transactionCount from backend
                                })) })), _jsx("button", { onClick: handlePreviousMonth, disabled: isLoadingReport, className: "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700", children: "\u2190 Previous" }), _jsx("div", { className: "min-w-[180px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white", children: formatMonth(selectedMonth) }), _jsx("button", { onClick: handleNextMonth, disabled: isLoadingReport || selectedMonth >= getCurrentMonth(), className: "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700", children: "Next \u2192" })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Spending by Category" }), _jsx(ExportButton, { month: selectedMonth, chartInstance: spendingChartRef.current, chartType: "spending-by-category" })] }), _jsx(Chart, { option: spendingByCategoryOption, loading: isLoadingReport, height: 400, className: "w-full", onChartReady: (chart) => {
                                    spendingChartRef.current = chart;
                                } })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Income vs Expenses" }), _jsx(ExportButton, { month: selectedMonth, chartInstance: incomeExpenseChartRef.current, chartType: "income-vs-expense" })] }), _jsx(Chart, { option: incomeVsExpenseOption, loading: isLoadingReport, height: 400, className: "w-full", onChartReady: (chart) => {
                                    incomeExpenseChartRef.current = chart;
                                } })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 lg:col-span-2", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "12-Month Trend" }), _jsx(ExportButton, { month: selectedMonth, chartInstance: trendChartRef.current, chartType: "monthly-trend" })] }), _jsx(Chart, { option: monthlyTrendOption, loading: isLoadingTrend, height: 400, className: "w-full", onChartReady: (chart) => {
                                    trendChartRef.current = chart;
                                } })] }), monthlyReport && monthlyReport.budgetSummaries.length > 0 && (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 lg:col-span-2", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Budget Progress" }), _jsx(ExportButton, { month: selectedMonth, chartInstance: budgetChartRef.current, chartType: "budget-progress" })] }), _jsx(Chart, { option: budgetProgressOption, loading: isLoadingReport, height: 400, className: "w-full", onChartReady: (chart) => {
                                    budgetChartRef.current = chart;
                                } })] }))] }), monthlyReport && (_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Total Income" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-green-600 dark:text-green-400", children: formatCurrency(monthlyReport.incomeVsExpense.incomeCents) })] }), _jsxs("div", { className: "rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Total Expenses" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-red-600 dark:text-red-400", children: formatCurrency(monthlyReport.incomeVsExpense.expenseCents) })] }), _jsxs("div", { className: "rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Net" }), _jsx("p", { className: `mt-1 text-2xl font-bold ${monthlyReport.incomeVsExpense.netCents >= 0
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-orange-600 dark:text-orange-400'}`, children: formatCurrency(monthlyReport.incomeVsExpense.netCents) })] })] })), monthlyReport?.forecast && (_jsxs("div", { className: "rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("h3", { className: "mb-2 text-lg font-semibold text-slate-900 dark:text-white", children: "Next Month Forecast" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Projected Income" }), _jsx("p", { className: "mt-1 text-xl font-semibold text-green-600 dark:text-green-400", children: formatCurrency(monthlyReport.forecast.nextMonthIncome) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Projected Expenses" }), _jsx("p", { className: "mt-1 text-xl font-semibold text-red-600 dark:text-red-400", children: formatCurrency(monthlyReport.forecast.nextMonthExpense) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Confidence" }), _jsxs("p", { className: "mt-1 text-xl font-semibold text-slate-900 dark:text-white", children: [(monthlyReport.forecast.confidence * 100).toFixed(1), "%"] })] })] })] }))] }));
}
