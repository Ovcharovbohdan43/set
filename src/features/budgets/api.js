import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { budgetEntrySchema, budgetSchema, createBudgetFormSchema, updateBudgetFormSchema } from './schema';
const budgetListSchema = z.array(budgetSchema);
export async function fetchBudgets() {
    const payload = await invoke('list_budgets');
    return budgetListSchema.parse(payload);
}
export async function fetchBudget(id) {
    const payload = await invoke('get_budget', { id });
    return budgetSchema.parse(payload);
}
export async function createBudget(data) {
    const payload = createBudgetFormSchema.parse(data);
    const result = await invoke('create_budget', { payload });
    return budgetSchema.parse(result);
}
export async function updateBudget(data) {
    const payload = updateBudgetFormSchema.parse(data);
    const result = await invoke('update_budget', { payload });
    return budgetSchema.parse(result);
}
export async function deleteBudget(id) {
    await invoke('delete_budget', { id });
}
export async function recordSnapshot(budgetId, actualCents, projectedCents, snapshotDate) {
    const payload = z
        .object({
        budgetId: z.string(),
        actualCents: z.number(),
        projectedCents: z.number(),
        snapshotDate: z.string()
    })
        .parse({ budgetId, actualCents, projectedCents, snapshotDate });
    const result = await invoke('record_snapshot', { payload });
    return budgetEntrySchema.parse(result);
}
