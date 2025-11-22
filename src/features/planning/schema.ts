import { z } from 'zod';

export const monthlyPlanSchema = z.object({
  id: z.string(),
  month: z.string(),
  totalPlannedIncome: z.number(),
  totalPlannedExpenses: z.number(),
  totalPlannedSavings: z.number(),
  note: z.string().nullable().optional()
});

export const createMonthlyPlanSchema = z.object({
  month: z.string(),
  totalPlannedIncome: z.number().optional(),
  totalPlannedExpenses: z.number().optional(),
  totalPlannedSavings: z.number().optional(),
  note: z.string().optional()
});

export const plannedIncomeSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  type: z.string(),
  expectedAmount: z.number(),
  actualAmount: z.number(),
  expectedDate: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  status: z.string()
});

export const addPlannedIncomeSchema = z.object({
  monthlyPlanId: z.string(),
  sourceName: z.string(),
  type: z.string(),
  expectedAmount: z.number(),
  expectedDate: z.string().optional(),
  isFixed: z.boolean().optional(),
  accountId: z.string().nullable().optional()
});

export const plannedExpenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  expectedAmount: z.number(),
  actualAmount: z.number(),
  categoryId: z.string().nullable().optional(),
  frequency: z.string()
});

export const addPlannedExpenseSchema = z.object({
  monthlyPlanId: z.string(),
  label: z.string(),
  categoryId: z.string().optional(),
  expectedAmount: z.number(),
  frequency: z.string().optional()
});

export const addDebtAccountSchema = z.object({
  name: z.string(),
  type: z.string(),
  principal: z.number(),
  interestRate: z.number(),
  minMonthlyPayment: z.number(),
  dueDay: z.number().int(),
  startDate: z.string()
});

export const updateDebtAccountSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.string().optional(),
  principal: z.number().optional(),
  interestRate: z.number().optional(),
  minMonthlyPayment: z.number().optional(),
  dueDay: z.number().int().optional(),
  currentBalance: z.number().optional()
});

export const debtAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  principal: z.number(),
  interestRate: z.number(),
  minMonthlyPayment: z.number(),
  dueDay: z.number(),
  currentBalance: z.number()
});

export const planActualSchema = z.object({
  planId: z.string(),
  plannedIncome: z.number(),
  actualIncome: z.number(),
  plannedExpenses: z.number(),
  actualExpenses: z.number(),
  plannedSavings: z.number().optional().default(0),
  actualSavings: z.number().optional().default(0)
});

export const plannedSavingSchema = z.object({
  id: z.string(),
  goalId: z.string().nullable().optional(),
  expectedAmount: z.number(),
  actualAmount: z.number()
});

export const addPlannedSavingSchema = z.object({
  monthlyPlanId: z.string(),
  goalId: z.string().nullable().optional(),
  expectedAmount: z.number()
});

export const updatePlannedSavingSchema = z.object({
  id: z.string(),
  goalId: z.string().nullable().optional(),
  expectedAmount: z.number().optional(),
  actualAmount: z.number().optional()
});

export const updatePlannedIncomeSchema = z.object({
  id: z.string(),
  sourceName: z.string().optional(),
  type: z.string().optional(),
  expectedAmount: z.number().optional(),
  expectedDate: z.string().optional(),
  isFixed: z.boolean().optional(),
  accountId: z.string().nullable().optional(),
  actualAmount: z.number().optional(),
  status: z.string().optional()
});

export const updatePlannedExpenseSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  expectedAmount: z.number().optional(),
  frequency: z.string().optional(),
  actualAmount: z.number().optional()
});

export const debtScheduleSchema = z.object({
  id: z.string(),
  debtAccountId: z.string(),
  dueDate: z.string(),
  plannedPayment: z.number(),
  plannedInterest: z.number(),
  plannedPrincipal: z.number(),
  isPaid: z.boolean()
});

export const generateDebtScheduleSchema = z.object({
  debtAccountId: z.string(),
  months: z.number().int().optional()
});

export const confirmDebtPaymentSchema = z.object({
  scheduleId: z.string(),
  accountId: z.string().optional(),
  categoryId: z.string().optional()
});

export type MonthlyPlan = z.infer<typeof monthlyPlanSchema>;
export type CreateMonthlyPlan = z.infer<typeof createMonthlyPlanSchema>;
export type PlannedIncome = z.infer<typeof plannedIncomeSchema>;
export type AddPlannedIncome = z.infer<typeof addPlannedIncomeSchema>;
export type UpdatePlannedIncome = z.infer<typeof updatePlannedIncomeSchema>;
export type PlannedExpense = z.infer<typeof plannedExpenseSchema>;
export type AddPlannedExpense = z.infer<typeof addPlannedExpenseSchema>;
export type UpdatePlannedExpense = z.infer<typeof updatePlannedExpenseSchema>;
export type AddDebtAccount = z.infer<typeof addDebtAccountSchema>;
export type UpdateDebtAccount = z.infer<typeof updateDebtAccountSchema>;
export type DebtAccount = z.infer<typeof debtAccountSchema>;
export type PlannedSaving = z.infer<typeof plannedSavingSchema>;
export type AddPlannedSaving = z.infer<typeof addPlannedSavingSchema>;
export type UpdatePlannedSaving = z.infer<typeof updatePlannedSavingSchema>;
export type PlanActual = z.infer<typeof planActualSchema>;
export type DebtSchedule = z.infer<typeof debtScheduleSchema>;
export type GenerateDebtSchedule = z.infer<typeof generateDebtScheduleSchema>;
export type ConfirmDebtPayment = z.infer<typeof confirmDebtPaymentSchema>;
