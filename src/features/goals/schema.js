import { z } from 'zod';
export const goalStatusSchema = z.enum(['active', 'paused', 'achieved', 'abandoned']);
export const goalSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    targetCents: z.number(),
    currentCents: z.number(),
    targetDate: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    categoryName: z.string().nullable().optional(),
    priority: z.number(),
    status: goalStatusSchema,
    progressPercent: z.number(),
    daysRemaining: z.number().nullable().optional(),
    projectedCompletionDate: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string()
});
export const createGoalFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    targetCents: z.number().int().nonnegative('Target must be non-negative'),
    targetDate: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    priority: z.number().int().optional(),
    status: goalStatusSchema.optional()
});
export const updateGoalFormSchema = createGoalFormSchema.partial().extend({
    id: z.string()
});
export const updateGoalStatusFormSchema = z.object({
    id: z.string(),
    status: goalStatusSchema
});
export const addContributionFormSchema = z.object({
    goalId: z.string(),
    amountCents: z.number().int().positive('Amount must be positive')
});
