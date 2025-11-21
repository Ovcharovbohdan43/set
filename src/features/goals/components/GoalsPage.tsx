import { useMemo, useState } from 'react';

import { useGoalsQuery, useDeleteGoalMutation, useUpdateGoalStatusMutation } from '../hooks';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import type { Goal, GoalStatus } from '../schema';

const STATUS_COLUMNS: { status: GoalStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'paused', label: 'Paused' },
  { status: 'achieved', label: 'Achieved' },
  { status: 'abandoned', label: 'Abandoned' }
];

export function GoalsPage() {
  const goalsQuery = useGoalsQuery();
  const deleteMutation = useDeleteGoalMutation();
  const updateStatusMutation = useUpdateGoalStatusMutation();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();

  const goalsByStatus = useMemo(() => {
    const grouped: Record<GoalStatus, Goal[]> = {
      active: [],
      paused: [],
      achieved: [],
      abandoned: []
    };

    goalsQuery.data?.forEach((goal) => {
      grouped[goal.status].push(goal);
    });

    // Sort by priority (descending) within each status
    Object.values(grouped).forEach((goals) => {
      goals.sort((a, b) => b.priority - a.priority);
    });

    return grouped;
  }, [goalsQuery.data]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete goal', error);
      }
    }
  };

  const handleStatusChange = async (goalId: string, newStatus: GoalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: goalId, status: newStatus });
    } catch (error) {
      console.error('Failed to update goal status', error);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingGoal(undefined);
  };

  if (goalsQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
        Loading goals...
      </div>
    );
  }

  if (goalsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        Error loading goals. Please try again.
      </div>
    );
  }

  const totalGoals = goalsQuery.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Goals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your savings goals and milestones
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          + New Goal
        </button>
      </div>

      {totalGoals === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70">
          <p className="text-slate-500 dark:text-slate-400">
            No goals yet. Create your first goal to start tracking your savings.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {STATUS_COLUMNS.map(({ status, label }) => {
            const goals = goalsByStatus[status];
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {label}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {goals.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="group relative">
                      <GoalCard goal={goal} onClick={() => handleEdit(goal)} />
                      <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <select
                          value={goal.status}
                          onChange={(e) =>
                            handleStatusChange(goal.id, e.target.value as GoalStatus)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {STATUS_COLUMNS.map(({ status: s, label: l }) => (
                            <option key={s} value={s}>
                              {l}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(goal.id);
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
            );
          })}
        </div>
      )}

      <GoalForm open={isFormOpen} onOpenChange={handleFormClose} goal={editingGoal} />
    </div>
  );
}

