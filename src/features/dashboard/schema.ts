import { z } from 'zod';

export const weeklySpendingPointSchema = z.object({
  date: z.string(),
  amountCents: z.number()
});

export const accountHighlightSchema = z.object({
  id: z.string(),
  name: z.string(),
  balanceCents: z.number(),
  accountType: z.string().nullable().optional(),
  colorToken: z.string().nullable().optional()
});

export const dashboardSnapshotSchema = z.object({
  currency: z.string().length(3),
  netWorthCents: z.number(),
  netWorthDeltaCents: z.number(),
  cashFlowCents: z.number(),
  cashFlowPreviousCents: z.number(),
  budgetTotalCents: z.number(),
  budgetSpentCents: z.number(),
  weeklySpending: z.array(weeklySpendingPointSchema),
  accounts: z.array(accountHighlightSchema)
});

export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;
export type WeeklySpendingPoint = z.infer<typeof weeklySpendingPointSchema>;
export type AccountHighlight = z.infer<typeof accountHighlightSchema>;

