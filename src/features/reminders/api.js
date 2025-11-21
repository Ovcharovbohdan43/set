import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { reminderSchema, createReminderFormSchema, updateReminderFormSchema, snoozeReminderFormSchema } from './schema';
const reminderListSchema = z.array(reminderSchema);
export async function fetchReminders() {
    const payload = await invoke('list_reminders');
    return reminderListSchema.parse(payload);
}
export async function fetchReminder(id) {
    const payload = await invoke('get_reminder', { id });
    return reminderSchema.parse(payload);
}
export async function createReminder(data) {
    const payload = createReminderFormSchema.parse(data);
    const result = await invoke('create_reminder', { payload });
    return reminderSchema.parse(result);
}
export async function updateReminder(data) {
    const payload = updateReminderFormSchema.parse(data);
    const result = await invoke('update_reminder', { payload });
    return reminderSchema.parse(result);
}
export async function deleteReminder(id) {
    await invoke('delete_reminder', { id });
}
export async function snoozeReminder(data) {
    const payload = snoozeReminderFormSchema.parse(data);
    const result = await invoke('snooze_reminder', { payload });
    return reminderSchema.parse(result);
}
export async function fetchDueReminders() {
    const payload = await invoke('get_due_reminders');
    return reminderListSchema.parse(payload);
}
export async function markReminderSent(id) {
    const result = await invoke('mark_reminder_sent', { id });
    return reminderSchema.parse(result);
}
