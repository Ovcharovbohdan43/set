import { useState } from 'react';

import * as Dialog from '@radix-ui/react-dialog';

import { useAccountsQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';

import type { Reminder, ReminderChannel, CreateReminderForm } from '../schema';
import { useCreateReminderMutation, useUpdateReminderMutation } from '../hooks';

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: Reminder;
  currency?: string;
}

export function ReminderForm({
  open,
  onOpenChange,
  reminder,
  currency = 'USD'
}: ReminderFormProps) {
  const isEditing = !!reminder;
  const accountsQuery = useAccountsQuery();
  const createMutation = useCreateReminderMutation();
  const updateMutation = useUpdateReminderMutation();

  const [formData, setFormData] = useState<CreateReminderForm>({
    title: reminder?.title ?? '',
    description: reminder?.description ?? null,
    accountId: reminder?.accountId ?? null,
    amountCents: reminder?.amountCents ?? null,
    dueAt: reminder?.dueAt ?? new Date().toISOString(),
    recurrenceRule: reminder?.recurrenceRule ?? null,
    channel: reminder?.channel ?? 'toast',
    snoozeMinutes: reminder?.snoozeMinutes ?? null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: reminder.id,
          ...formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save reminder', error);
    }
  };

  const accounts = accountsQuery.data ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <Dialog.Title className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Reminder' : 'Create Reminder'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value || null
                  })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account (optional)
                </label>
                <select
                  value={formData.accountId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountId: e.target.value || null
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">None</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amountCents ? formData.amountCents / 100 : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amountCents: e.target.value ? parseInputAmount(e.target.value) : null
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueAt.slice(0, 16)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dueAt: new Date(e.target.value).toISOString()
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recurrence (optional)
                </label>
                <select
                  value={formData.recurrenceRule ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrenceRule: e.target.value || null
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">None</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Channel
                </label>
                <select
                  value={formData.channel ?? 'toast'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      channel: e.target.value as ReminderChannel
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="toast">Toast</option>
                  <option value="in_app">In-App</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditing
                    ? 'Update'
                    : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

