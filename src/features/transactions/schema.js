import { z } from 'zod';
export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const accountSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    currency: z.string().length(3),
    balanceCents: z.number(),
    availableBalanceCents: z.number().nullable().optional(),
    colorToken: z.string().nullable().optional()
});
export const categorySchema = z.object({
    id: z.string(),
    name: z.string(),
    type: transactionTypeSchema,
    sortOrder: z.number()
});
export const transactionSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    accountName: z.string(),
    categoryId: z.string().nullable().optional(),
    categoryName: z.string().nullable().optional(),
    type: transactionTypeSchema,
    amountCents: z.number(),
    currency: z.string().length(3),
    occurredOn: z.string(),
    cleared: z.boolean(),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    goalId: z.string().nullable().optional()
});
export const transactionFormSchema = z.object({
    id: z.string().optional(),
    accountId: z.string().min(1, 'Account is required'),
    categoryId: z.string().optional().nullable(),
    type: transactionTypeSchema,
    amountCents: z
        .number()
        .int()
        .positive('Amount must be greater than zero'),
    currency: z.string().length(3),
    occurredOn: z.string(),
    notes: z.string().max(280).nullable().optional(),
    tags: z.array(z.string()).optional(),
    cleared: z.boolean().optional(),
    goalId: z.string().nullable().optional()
});
export const transactionFiltersSchema = z.object({
    accountId: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    search: z.string().optional()
});
