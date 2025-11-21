import { z } from 'zod';
export const reminderChannelSchema = z.enum(['toast', 'in_app', 'email']);
export const reminderStatusSchema = z.enum(['scheduled', 'sent', 'snoozed', 'dismissed']);
export const reminderSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    accountName: z.string().nullable().optional(),
    amountCents: z.number().nullable().optional(),
    dueAt: z.string(),
    recurrenceRule: z.string().nullable().optional(),
    nextFireAt: z.string().nullable().optional(),
    channel: reminderChannelSchema,
    snoozeMinutes: z.number().nullable().optional(),
    lastTriggeredAt: z.string().nullable().optional(),
    status: reminderStatusSchema,
    createdAt: z.string()
});
export const createReminderFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().max(500).nullable().optional(),
    accountId: z.string().nullable().optional(),
    amountCents: z.number().int().nonnegative().nullable().optional(),
    dueAt: z.string(),
    recurrenceRule: z.string().nullable().optional(),
    channel: reminderChannelSchema.optional(),
    snoozeMinutes: z.number().int().nonnegative().nullable().optional()
});
export const updateReminderFormSchema = createReminderFormSchema.partial().extend({
    id: z.string(),
    status: reminderStatusSchema.optional()
});
export const snoozeReminderFormSchema = z.object({
    id: z.string(),
    snoozeMinutes: z.number().int().positive('Snooze minutes must be positive')
});
