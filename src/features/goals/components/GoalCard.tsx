import { formatCurrency } from '@/features/transactions/utils/money';
import type { Goal } from '../schema';
import { formatDaysRemaining, getGoalStatusColor } from '../utils';

interface GoalCardProps {
  goal: Goal;
  currency?: string;
  onClick?: () => void;
}

export function GoalCard({ goal, currency = 'USD', onClick }: GoalCardProps) {
  const progress = Math.min(100, goal.progressPercent);
  const remaining = goal.targetCents - goal.currentCents;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{goal.name}</h3>
          {goal.categoryName && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {goal.categoryName}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${getGoalStatusColor(goal.status)}`}
        >
          {goal.status}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(goal.currentCents, currency)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            / {formatCurrency(goal.targetCents, currency)}
          </span>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{progress.toFixed(0)}% complete</span>
          <span>{formatCurrency(remaining, currency)} remaining</span>
        </div>

        {goal.daysRemaining !== null && goal.daysRemaining !== undefined && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {formatDaysRemaining(goal.daysRemaining)}
          </div>
        )}
      </div>
    </div>
  );
}

