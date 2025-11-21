import { z } from 'zod';

export const budgetPeriodSchema = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);
export const budgetTypeSchema = z.enum(['envelope', 'overall']);
export const budgetStatusSchema = z.enum(['normal', 'atRisk', 'over']);

export const budgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  period: budgetPeriodSchema,
  budgetType: budgetTypeSchema,
  categoryId: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  amountCents: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  rollover: z.boolean(),
  alertThreshold: z.number(),
  spentCents: z.number(),
  remainingCents: z.number(),
  progressPercent: z.number(),
  status: budgetStatusSchema,
  createdAt: z.string()
});

export type Budget = z.infer<typeof budgetSchema>;
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;
export type BudgetType = z.infer<typeof budgetTypeSchema>;
export type BudgetStatus = z.infer<typeof budgetStatusSchema>;

export const createBudgetFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  period: budgetPeriodSchema,
  budgetType: budgetTypeSchema,
  categoryId: z.string().nullable().optional(),
  amountCents: z.number().int().nonnegative('Amount must be non-negative'),
  startDate: z.string(),
  endDate: z.string(),
  rollover: z.boolean().optional(),
  alertThreshold: z.number().min(0).max(1).optional()
});

export type CreateBudgetForm = z.infer<typeof createBudgetFormSchema>;

export const updateBudgetFormSchema = createBudgetFormSchema.partial().extend({
  id: z.string()
});

export type UpdateBudgetForm = z.infer<typeof updateBudgetFormSchema>;

export const budgetEntrySchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  actualCents: z.number(),
  projectedCents: z.number(),
  snapshotDate: z.string(),
  createdAt: z.string()
});

export type BudgetEntry = z.infer<typeof budgetEntrySchema>;

