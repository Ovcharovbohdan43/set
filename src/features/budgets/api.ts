import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

import {
  budgetEntrySchema,
  budgetSchema,
  createBudgetFormSchema,
  updateBudgetFormSchema,
  type Budget,
  type BudgetEntry,
  type CreateBudgetForm,
  type UpdateBudgetForm
} from './schema';

const budgetListSchema = z.array(budgetSchema);

export async function fetchBudgets(): Promise<Budget[]> {
  const payload = await invoke<Budget[]>('list_budgets');
  return budgetListSchema.parse(payload);
}

export async function fetchBudget(id: string): Promise<Budget> {
  const payload = await invoke<Budget>('get_budget', { id });
  return budgetSchema.parse(payload);
}

export async function createBudget(data: CreateBudgetForm): Promise<Budget> {
  const payload = createBudgetFormSchema.parse(data);
  const result = await invoke<Budget>('create_budget', { payload });
  return budgetSchema.parse(result);
}

export async function updateBudget(data: UpdateBudgetForm): Promise<Budget> {
  const payload = updateBudgetFormSchema.parse(data);
  const result = await invoke<Budget>('update_budget', { payload });
  return budgetSchema.parse(result);
}

export async function deleteBudget(id: string): Promise<void> {
  await invoke('delete_budget', { id });
}

export async function recordSnapshot(
  budgetId: string,
  actualCents: number,
  projectedCents: number,
  snapshotDate: string
): Promise<BudgetEntry> {
  const payload = z
    .object({
      budgetId: z.string(),
      actualCents: z.number(),
      projectedCents: z.number(),
      snapshotDate: z.string()
    })
    .parse({ budgetId, actualCents, projectedCents, snapshotDate });
  const result = await invoke<BudgetEntry>('record_snapshot', { payload });
  return budgetEntrySchema.parse(result);
}

