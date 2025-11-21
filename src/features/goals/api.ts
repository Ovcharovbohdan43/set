import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

import {
  addContributionFormSchema,
  createGoalFormSchema,
  goalSchema,
  updateGoalFormSchema,
  updateGoalStatusFormSchema,
  type AddContributionForm,
  type Goal,
  type CreateGoalForm,
  type UpdateGoalForm,
  type UpdateGoalStatusForm
} from './schema';

const goalListSchema = z.array(goalSchema);

export async function fetchGoals(): Promise<Goal[]> {
  const payload = await invoke<Goal[]>('list_goals');
  return goalListSchema.parse(payload);
}

export async function fetchGoal(id: string): Promise<Goal> {
  const payload = await invoke<Goal>('get_goal', { id });
  return goalSchema.parse(payload);
}

export async function createGoal(data: CreateGoalForm): Promise<Goal> {
  const payload = createGoalFormSchema.parse(data);
  const result = await invoke<Goal>('create_goal', { payload });
  return goalSchema.parse(result);
}

export async function updateGoal(data: UpdateGoalForm): Promise<Goal> {
  const payload = updateGoalFormSchema.parse(data);
  const result = await invoke<Goal>('update_goal', { payload });
  return goalSchema.parse(result);
}

export async function updateGoalStatus(data: UpdateGoalStatusForm): Promise<Goal> {
  const payload = updateGoalStatusFormSchema.parse(data);
  const result = await invoke<Goal>('update_goal_status', { payload });
  return goalSchema.parse(result);
}

export async function addContribution(data: AddContributionForm): Promise<Goal> {
  const payload = addContributionFormSchema.parse(data);
  const result = await invoke<Goal>('add_contribution', { payload });
  return goalSchema.parse(result);
}

export async function deleteGoal(id: string): Promise<void> {
  await invoke('delete_goal', { id });
}

