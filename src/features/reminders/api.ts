import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

import {
  reminderSchema,
  createReminderFormSchema,
  updateReminderFormSchema,
  snoozeReminderFormSchema,
  type Reminder,
  type CreateReminderForm,
  type UpdateReminderForm,
  type SnoozeReminderForm
} from './schema';

const reminderListSchema = z.array(reminderSchema);

export async function fetchReminders(): Promise<Reminder[]> {
  const payload = await invoke<Reminder[]>('list_reminders');
  return reminderListSchema.parse(payload);
}

export async function fetchReminder(id: string): Promise<Reminder> {
  const payload = await invoke<Reminder>('get_reminder', { id });
  return reminderSchema.parse(payload);
}

export async function createReminder(data: CreateReminderForm): Promise<Reminder> {
  const payload = createReminderFormSchema.parse(data);
  const result = await invoke<Reminder>('create_reminder', { payload });
  return reminderSchema.parse(result);
}

export async function updateReminder(data: UpdateReminderForm): Promise<Reminder> {
  const payload = updateReminderFormSchema.parse(data);
  const result = await invoke<Reminder>('update_reminder', { payload });
  return reminderSchema.parse(result);
}

export async function deleteReminder(id: string): Promise<void> {
  await invoke('delete_reminder', { id });
}

export async function snoozeReminder(data: SnoozeReminderForm): Promise<Reminder> {
  const payload = snoozeReminderFormSchema.parse(data);
  const result = await invoke<Reminder>('snooze_reminder', { payload });
  return reminderSchema.parse(result);
}

export async function fetchDueReminders(): Promise<Reminder[]> {
  const payload = await invoke<Reminder[]>('get_due_reminders');
  return reminderListSchema.parse(payload);
}

export async function markReminderSent(id: string): Promise<Reminder> {
  const result = await invoke<Reminder>('mark_reminder_sent', { id });
  return reminderSchema.parse(result);
}

