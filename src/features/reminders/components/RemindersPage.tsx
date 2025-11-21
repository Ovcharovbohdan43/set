import { useState } from 'react';

import {
  useRemindersQuery,
  useDeleteReminderMutation,
  useSnoozeReminderMutation,
  useUpdateReminderMutation
} from '../hooks';
import { ReminderCard } from './ReminderCard';
import { ReminderForm } from './ReminderForm';
import type { Reminder } from '../schema';

export function RemindersPage() {
  const remindersQuery = useRemindersQuery();
  const deleteMutation = useDeleteReminderMutation();
  const snoozeMutation = useSnoozeReminderMutation();
  const updateMutation = useUpdateReminderMutation();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>();

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete reminder', error);
      }
    }
  };

  const handleSnooze = async (id: string) => {
    try {
      await snoozeMutation.mutateAsync({ id, snoozeMinutes: 15 });
    } catch (error) {
      console.error('Failed to snooze reminder', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        status: 'dismissed'
      });
    } catch (error) {
      console.error('Failed to dismiss reminder', error);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingReminder(undefined);
  };

  if (remindersQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
        Loading reminders...
      </div>
    );
  }

  if (remindersQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        Error loading reminders. Please try again.
      </div>
    );
  }

  const reminders = remindersQuery.data ?? [];
  const scheduled = reminders.filter((r) => r.status === 'scheduled');
  const sent = reminders.filter((r) => r.status === 'sent');
  const snoozed = reminders.filter((r) => r.status === 'snoozed');
  const dismissed = reminders.filter((r) => r.status === 'dismissed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reminders</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your payment reminders and notifications
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          + New Reminder
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70">
          <p className="text-slate-500 dark:text-slate-400">
            No reminders yet. Create your first reminder to stay on top of payments.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {scheduled.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Scheduled ({scheduled.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scheduled.map((reminder) => (
                  <div key={reminder.id} className="group relative">
                    <ReminderCard
                      reminder={reminder}
                      onClick={() => handleEdit(reminder)}
                      onSnooze={handleSnooze}
                      onDismiss={handleDismiss}
                    />
                    <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(reminder);
                        }}
                        className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(reminder.id);
                        }}
                        className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snoozed.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Snoozed ({snoozed.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {snoozed.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onClick={() => handleEdit(reminder)}
                    onSnooze={handleSnooze}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          )}

          {sent.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Sent ({sent.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sent.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onClick={() => handleEdit(reminder)}
                  />
                ))}
              </div>
            </div>
          )}

          {dismissed.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Dismissed ({dismissed.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dismissed.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onClick={() => handleEdit(reminder)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ReminderForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        reminder={editingReminder}
      />
    </div>
  );
}

