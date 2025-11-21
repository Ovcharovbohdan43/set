import { z } from 'zod';
export const categorySpendingSchema = z.object({
    categoryId: z.string().nullable().optional(),
    categoryName: z.string(),
    amountCents: z.number(),
    percentage: z.number()
});
export const trendPointSchema = z.object({
    date: z.string(),
    incomeCents: z.number(),
    expenseCents: z.number()
});
export const incomeVsExpenseSchema = z.object({
    incomeCents: z.number(),
    expenseCents: z.number(),
    netCents: z.number()
});
export const budgetSummarySchema = z.object({
    budgetId: z.string(),
    budgetName: z.string(),
    targetCents: z.number(),
    spentCents: z.number(),
    progressPercent: z.number()
});
export const forecastSchema = z.object({
    nextMonthIncome: z.number(),
    nextMonthExpense: z.number(),
    confidence: z.number()
}).nullable().optional();
export const monthlyReportSchema = z.object({
    month: z.string(),
    spendingByCategory: z.array(categorySpendingSchema),
    trendLine: z.array(trendPointSchema),
    incomeVsExpense: incomeVsExpenseSchema,
    budgetSummaries: z.array(budgetSummarySchema),
    forecast: forecastSchema
});
export const spendingByCategorySchema = z.object({
    categoryId: z.string().nullable().optional(),
    categoryName: z.string(),
    amountCents: z.number(),
    percentage: z.number(),
    transactionCount: z.number()
});
export const monthlyTrendSchema = z.object({
    month: z.string(),
    incomeCents: z.number(),
    expenseCents: z.number(),
    netCents: z.number()
});
