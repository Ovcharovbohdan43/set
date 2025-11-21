import { formatCurrency } from '@/features/transactions/utils/money';
import type { Budget } from '../schema';
import { getBudgetStatusColor, getBudgetStatusRingColor } from '../utils';

interface BudgetCardProps {
  budget: Budget;
  currency?: string;
  onClick?: () => void;
}

export function BudgetCard({ budget, currency = 'USD', onClick }: BudgetCardProps) {
  const progress = Math.min(100, budget.progressPercent);
  const circumference = 2 * Math.PI * 36; // radius = 36
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {budget.name}
          </h3>
          {budget.categoryName && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {budget.categoryName}
            </p>
          )}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(budget.spentCents, currency)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              / {formatCurrency(budget.amountCents, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm font-medium ${getBudgetStatusColor(budget.status)}`}>
              {budget.status === 'over' ? 'Over budget' : `${progress.toFixed(0)}% used`}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatCurrency(budget.remainingCents, currency)} remaining
            </span>
          </div>
        </div>
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${getBudgetStatusRingColor(budget.status)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

