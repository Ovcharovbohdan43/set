import { useState } from 'react';

import { useBudgetsQuery, useDeleteBudgetMutation } from '../hooks';
import { BudgetCard } from './BudgetCard';
import { BudgetForm } from './BudgetForm';
import type { Budget } from '../schema';

export function BudgetsPage() {
  const budgetsQuery = useBudgetsQuery();
  const deleteMutation = useDeleteBudgetMutation();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete budget', error);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBudget(undefined);
  };

  if (budgetsQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
        Loading budgets...
      </div>
    );
  }

  if (budgetsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        Error loading budgets. Please try again.
      </div>
    );
  }

  const budgets = budgetsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Budgets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your spending and stay on budget
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          + New Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70">
          <p className="text-slate-500 dark:text-slate-400">
            No budgets yet. Create your first budget to start tracking your spending.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <div key={budget.id} className="group relative">
              <BudgetCard budget={budget} onClick={() => handleEdit(budget)} />
              <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(budget);
                  }}
                  className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(budget.id);
                  }}
                  className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BudgetForm open={isFormOpen} onOpenChange={handleFormClose} budget={editingBudget} />
    </div>
  );
}

