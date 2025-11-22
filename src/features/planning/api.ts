/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion */
import { invoke } from '@tauri-apps/api/core';
import {
  addPlannedExpenseSchema,
  addPlannedIncomeSchema,
  addDebtAccountSchema,
  createMonthlyPlanSchema,
  debtAccountSchema,
  debtScheduleSchema,
  monthlyPlanSchema,
  addPlannedSavingSchema,
  planActualSchema,
  plannedExpenseSchema,
  plannedIncomeSchema,
  plannedSavingSchema,
  updateDebtAccountSchema,
  updatePlannedExpenseSchema,
  updatePlannedIncomeSchema,
  updatePlannedSavingSchema,
  generateDebtScheduleSchema,
  confirmDebtPaymentSchema,
  type AddDebtAccount,
  type AddPlannedExpense,
  type AddPlannedIncome,
  type AddPlannedSaving,
  type DebtSchedule,
  type GenerateDebtSchedule,
  type ConfirmDebtPayment,
  type CreateMonthlyPlan,
  type DebtAccount,
  type MonthlyPlan,
  type PlanActual,
  type PlannedExpense,
  type PlannedIncome,
  type PlannedSaving,
  type UpdateDebtAccount,
  type UpdatePlannedExpense,
  type UpdatePlannedIncome,
  type UpdatePlannedSaving
} from './schema';

export async function createMonthlyPlan(input: CreateMonthlyPlan): Promise<MonthlyPlan> {
  const payload = createMonthlyPlanSchema.parse(input);
  const res = await invoke<unknown>('create_monthly_plan', { input: payload });
  return monthlyPlanSchema.parse({
    id: (res as any).id,
    month: (res as any).month,
    totalPlannedIncome: (res as any).total_planned_income ?? 0,
    totalPlannedExpenses: (res as any).total_planned_expenses ?? 0,
    totalPlannedSavings: (res as any).total_planned_savings ?? 0,
    note: (res as any).note ?? null
  });
}

export async function listMonthlyPlans(): Promise<MonthlyPlan[]> {
  const res = await invoke<unknown>('list_monthly_plans');
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    monthlyPlanSchema.parse({
      id: (item as any).id,
      month: (item as any).month,
      totalPlannedIncome: (item as any).total_planned_income ?? 0,
      totalPlannedExpenses: (item as any).total_planned_expenses ?? 0,
      totalPlannedSavings: (item as any).total_planned_savings ?? 0,
      note: (item as any).note ?? null
    })
  );
}

export async function addPlannedIncome(input: AddPlannedIncome): Promise<PlannedIncome> {
  const payload = addPlannedIncomeSchema.parse(input);
  const res = await invoke<unknown>('add_planned_income', { input: payload });
  return plannedIncomeSchema.parse({
    id: (res as any).id,
    sourceName: (res as any).source_name,
    type: (res as any).type,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount,
    expectedDate: (res as any).expected_date ?? null,
    accountId: (res as any).account_id ?? null,
    status: (res as any).status
  });
}

export async function listPlannedIncomes(monthlyPlanId: string): Promise<PlannedIncome[]> {
  const res = await invoke<unknown>('list_planned_incomes', { planId: monthlyPlanId });
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    plannedIncomeSchema.parse({
      id: (item as any).id,
      sourceName: (item as any).source_name,
      type: (item as any).type,
      expectedAmount: (item as any).expected_amount,
      actualAmount: (item as any).actual_amount,
      expectedDate: (item as any).expected_date ?? null,
      accountId: (item as any).account_id ?? null,
      status: (item as any).status
    })
  );
}

export async function updatePlannedIncome(input: UpdatePlannedIncome): Promise<PlannedIncome> {
  const payload = updatePlannedIncomeSchema.parse(input);
  const res = await invoke<unknown>('update_planned_income', { input: payload });
  return plannedIncomeSchema.parse({
    id: (res as any).id,
    sourceName: (res as any).source_name,
    type: (res as any).type,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount,
    expectedDate: (res as any).expected_date ?? null,
    accountId: (res as any).account_id ?? null,
    status: (res as any).status
  });
}

export async function deletePlannedIncome(id: string): Promise<void> {
  await invoke('delete_planned_income', { input: { id } });
}

export async function addPlannedExpense(input: AddPlannedExpense): Promise<PlannedExpense> {
  const payload = addPlannedExpenseSchema.parse(input);
  const res = await invoke<unknown>('add_planned_expense', { input: payload });
  return plannedExpenseSchema.parse({
    id: (res as any).id,
    label: (res as any).label,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount,
    categoryId: (res as any).category_id ?? null,
    frequency: (res as any).frequency
  });
}

export async function listPlannedExpenses(monthlyPlanId: string): Promise<PlannedExpense[]> {
  const res = await invoke<unknown>('list_planned_expenses', { planId: monthlyPlanId });
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    plannedExpenseSchema.parse({
      id: (item as any).id,
      label: (item as any).label,
      expectedAmount: (item as any).expected_amount,
      actualAmount: (item as any).actual_amount,
      categoryId: (item as any).category_id ?? null,
      frequency: (item as any).frequency
    })
  );
}

export async function updatePlannedExpense(
  input: UpdatePlannedExpense
): Promise<PlannedExpense> {
  const payload = updatePlannedExpenseSchema.parse(input);
  const res = await invoke<unknown>('update_planned_expense', { input: payload });
  return plannedExpenseSchema.parse({
    id: (res as any).id,
    label: (res as any).label,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount,
    categoryId: (res as any).category_id ?? null,
    frequency: (res as any).frequency
  });
}

export async function deletePlannedExpense(id: string): Promise<void> {
  await invoke('delete_planned_expense', { input: { id } });
}

export async function addDebtAccount(input: AddDebtAccount): Promise<DebtAccount> {
  const payload = addDebtAccountSchema.parse(input);
  const res = await invoke<unknown>('add_debt_account', { input: payload });
  return debtAccountSchema.parse({
    id: (res as any).id,
    name: (res as any).name,
    type: (res as any).type,
    principal: (res as any).principal,
    interestRate: (res as any).interest_rate,
    minMonthlyPayment: (res as any).min_monthly_payment,
    dueDay: (res as any).due_day,
    currentBalance: (res as any).current_balance
  });
}

export async function listDebtAccounts(): Promise<DebtAccount[]> {
  const res = await invoke<unknown>('list_debt_accounts');
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    debtAccountSchema.parse({
      id: (item as any).id,
      name: (item as any).name,
      type: (item as any).type,
      principal: (item as any).principal,
      interestRate: (item as any).interest_rate,
      minMonthlyPayment: (item as any).min_monthly_payment,
      dueDay: (item as any).due_day,
      currentBalance: (item as any).current_balance
    })
  );
}

export async function updateDebtAccount(input: UpdateDebtAccount): Promise<DebtAccount> {
  const payload = updateDebtAccountSchema.parse(input);
  const res = await invoke<unknown>('update_debt_account', { input: payload });
  return debtAccountSchema.parse({
    id: (res as any).id,
    name: (res as any).name,
    type: (res as any).type,
    principal: (res as any).principal,
    interestRate: (res as any).interest_rate,
    minMonthlyPayment: (res as any).min_monthly_payment,
    dueDay: (res as any).due_day,
    currentBalance: (res as any).current_balance
  });
}

export async function deleteDebtAccount(id: string): Promise<void> {
  await invoke('delete_debt_account', { input: { id } });
}

export async function addPlannedSaving(input: AddPlannedSaving): Promise<PlannedSaving> {
  const payload = addPlannedSavingSchema.parse(input);
  const res = await invoke<unknown>('add_planned_saving', { input: payload });
  return plannedSavingSchema.parse({
    id: (res as any).id,
    goalId: (res as any).goal_id ?? null,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount
  });
}

export async function listPlannedSavings(monthlyPlanId: string): Promise<PlannedSaving[]> {
  const res = await invoke<unknown>('list_planned_savings', { planId: monthlyPlanId });
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    plannedSavingSchema.parse({
      id: (item as any).id,
      goalId: (item as any).goal_id ?? null,
      expectedAmount: (item as any).expected_amount,
      actualAmount: (item as any).actual_amount
    })
  );
}

export async function updatePlannedSaving(
  input: UpdatePlannedSaving
): Promise<PlannedSaving> {
  const payload = updatePlannedSavingSchema.parse(input);
  const res = await invoke<unknown>('update_planned_saving', { input: payload });
  return plannedSavingSchema.parse({
    id: (res as any).id,
    goalId: (res as any).goal_id ?? null,
    expectedAmount: (res as any).expected_amount,
    actualAmount: (res as any).actual_amount
  });
}

export async function deletePlannedSaving(id: string): Promise<void> {
  await invoke('delete_planned_saving', { input: { id } });
}

export async function fetchPlanVsActual(planId: string): Promise<PlanActual> {
  const res = await invoke<unknown>('plan_vs_actual', { planId });
  return planActualSchema.parse({
    planId: (res as any).plan_id ?? planId,
    plannedIncome: (res as any).planned_income ?? 0,
    actualIncome: (res as any).actual_income ?? 0,
    plannedExpenses: (res as any).planned_expenses ?? 0,
    actualExpenses: (res as any).actual_expenses ?? 0,
    plannedSavings: (res as any).planned_savings ?? 0,
    actualSavings: (res as any).actual_savings ?? 0
  });
}

export async function generateDebtSchedule(
  input: GenerateDebtSchedule
): Promise<DebtSchedule[]> {
  const payload = generateDebtScheduleSchema.parse(input);
  const res = await invoke<unknown>('generate_debt_schedule', { input: payload });
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    debtScheduleSchema.parse({
      id: (item as any).id,
      debtAccountId: (item as any).debt_account_id ?? input.debtAccountId,
      dueDate: (item as any).due_date,
      plannedPayment: (item as any).planned_payment,
      plannedInterest: (item as any).planned_interest,
      plannedPrincipal: (item as any).planned_principal,
      isPaid: Boolean((item as any).is_paid)
    })
  );
}

export async function fetchDebtSchedule(debtId: string): Promise<DebtSchedule[]> {
  const res = await invoke<unknown>('list_debt_schedule', { debtId });
  const arr = Array.isArray(res) ? res : [];
  return arr.map((item) =>
    debtScheduleSchema.parse({
      id: (item as any).id,
      debtAccountId: (item as any).debt_account_id ?? debtId,
      dueDate: (item as any).due_date,
      plannedPayment: (item as any).planned_payment,
      plannedInterest: (item as any).planned_interest,
      plannedPrincipal: (item as any).planned_principal,
      isPaid: Boolean((item as any).is_paid)
    })
  );
}

export async function confirmDebtPayment(
  input: ConfirmDebtPayment
): Promise<DebtSchedule[]> {
  const payload = confirmDebtPaymentSchema.parse(input);
  const res = await invoke<unknown>('confirm_debt_payment', { input: payload });
  const arr = Array.isArray(res) ? res : [res];
  return arr.map((item) =>
    debtScheduleSchema.parse({
      id: (item as any).id,
      debtAccountId: (item as any).debt_account_id ?? input.scheduleId,
      dueDate: (item as any).due_date,
      plannedPayment: (item as any).planned_payment,
      plannedInterest: (item as any).planned_interest,
      plannedPrincipal: (item as any).planned_principal,
      isPaid: Boolean((item as any).is_paid)
    })
  );
}
