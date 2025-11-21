import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { addContributionFormSchema, createGoalFormSchema, goalSchema, updateGoalFormSchema, updateGoalStatusFormSchema } from './schema';
const goalListSchema = z.array(goalSchema);
export async function fetchGoals() {
    const payload = await invoke('list_goals');
    return goalListSchema.parse(payload);
}
export async function fetchGoal(id) {
    const payload = await invoke('get_goal', { id });
    return goalSchema.parse(payload);
}
export async function createGoal(data) {
    const payload = createGoalFormSchema.parse(data);
    const result = await invoke('create_goal', { payload });
    return goalSchema.parse(result);
}
export async function updateGoal(data) {
    const payload = updateGoalFormSchema.parse(data);
    const result = await invoke('update_goal', { payload });
    return goalSchema.parse(result);
}
export async function updateGoalStatus(data) {
    const payload = updateGoalStatusFormSchema.parse(data);
    const result = await invoke('update_goal_status', { payload });
    return goalSchema.parse(result);
}
export async function addContribution(data) {
    const payload = addContributionFormSchema.parse(data);
    const result = await invoke('add_contribution', { payload });
    return goalSchema.parse(result);
}
export async function deleteGoal(id) {
    await invoke('delete_goal', { id });
}
