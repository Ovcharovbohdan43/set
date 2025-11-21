import { z } from 'zod';

export const userSettingsSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  defaultCurrency: z.string(),
  locale: z.string(),
  weekStartsOn: z.number(),
  telemetryOptIn: z.boolean(),
  themePreference: z.string().nullable()
});

export const updateUserSettingsSchema = z.object({
  defaultCurrency: z.string().optional(),
  locale: z.string().optional(),
  weekStartsOn: z.number().optional(),
  telemetryOptIn: z.boolean().optional(),
  themePreference: z.string().optional(),
  displayName: z.string().optional()
});

export const updateCategoryOrderSchema = z.object({
  categoryIds: z.array(z.string())
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UpdateCategoryOrder = z.infer<typeof updateCategoryOrderSchema>;

