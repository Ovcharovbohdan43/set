import { useState } from 'react';

import * as Dialog from '@radix-ui/react-dialog';

import { useCategoriesQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';

import type { Goal, GoalStatus, CreateGoalForm } from '../schema';
import { useCreateGoalMutation, useUpdateGoalMutation } from '../hooks';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
  currency?: string;
}

export function GoalForm({ open, onOpenChange, goal, currency = 'USD' }: GoalFormProps) {
  const isEditing = !!goal;
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateGoalMutation();
  const updateMutation = useUpdateGoalMutation();

  const [formData, setFormData] = useState<CreateGoalForm>({
    name: goal?.name ?? '',
    targetCents: goal?.targetCents ?? 0,
    targetDate: goal?.targetDate ?? null,
    categoryId: goal?.categoryId ?? null,
    priority: goal?.priority ?? 0,
    status: goal?.status ?? 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: goal.id,
          ...formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save goal', error);
    }
  };

  const allCategories = categoriesQuery.data ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <Dialog.Title className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Goal' : 'Create Goal'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Target Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.targetCents / 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetCents: parseInputAmount(e.target.value)
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={formData.targetDate ? formData.targetDate.slice(0, 10) : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category (optional)
              </label>
              <select
                value={formData.categoryId ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: e.target.value || null
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">None</option>
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priority ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: Number.parseInt(e.target.value, 10) || 0
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={formData.status ?? 'active'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as GoalStatus
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="achieved">Achieved</option>
                  <option value="abandoned">Abandoned</option>
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

