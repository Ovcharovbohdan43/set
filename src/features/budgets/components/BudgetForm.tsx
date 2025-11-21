import { useState } from 'react';

import * as Dialog from '@radix-ui/react-dialog';

import { useCategoriesQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';

import type { Budget, BudgetPeriod, BudgetType, CreateBudgetForm } from '../schema';
import { useCreateBudgetMutation, useUpdateBudgetMutation } from '../hooks';

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  currency?: string;
}

export function BudgetForm({ open, onOpenChange, budget, currency = 'USD' }: BudgetFormProps) {
  const isEditing = !!budget;
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateBudgetMutation();
  const updateMutation = useUpdateBudgetMutation();

  const [formData, setFormData] = useState<CreateBudgetForm>({
    name: budget?.name ?? '',
    period: budget?.period ?? 'monthly',
    budgetType: budget?.budgetType ?? 'envelope',
    categoryId: budget?.categoryId ?? null,
    amountCents: budget?.amountCents ?? 0,
    startDate: budget?.startDate ?? new Date().toISOString(),
    endDate: budget?.endDate ?? new Date().toISOString(),
    rollover: budget?.rollover ?? false,
    alertThreshold: budget?.alertThreshold ?? 0.8
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: budget.id,
          ...formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save budget', error);
    }
  };

  const expenseCategories =
    categoriesQuery.data?.filter((c) => c.type === 'expense') ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <Dialog.Title className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Budget' : 'Create Budget'}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value as BudgetPeriod })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={formData.budgetType}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetType: e.target.value as BudgetType })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="envelope">Envelope</option>
                  <option value="overall">Overall</option>
                </select>
              </div>
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
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
                required
                min="0"
                value={formData.amountCents / 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amountCents: parseInputAmount(e.target.value)
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate.slice(0, 16)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: new Date(e.target.value).toISOString()
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate.slice(0, 16)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: new Date(e.target.value).toISOString()
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.rollover}
                  onChange={(e) => setFormData({ ...formData, rollover: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Rollover</span>
              </label>

              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Alert Threshold ({Math.round((formData.alertThreshold ?? 0.8) * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.alertThreshold ?? 0.8}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertThreshold: Number.parseFloat(e.target.value)
                    })
                  }
                  className="mt-1 w-full"
                />
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

