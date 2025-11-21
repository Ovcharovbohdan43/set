import { formatCurrency } from '@/features/transactions/utils/money';
import type { Reminder } from '../schema';
import { formatReminderDate, getReminderStatusColor, isOverdue } from '../utils';

interface ReminderCardProps {
  reminder: Reminder;
  currency?: string;
  onClick?: () => void;
  onSnooze?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function ReminderCard({
  reminder,
  currency = 'USD',
  onClick,
  onSnooze,
  onDismiss
}: ReminderCardProps) {
  const overdue = isOverdue(reminder.nextFireAt ?? reminder.dueAt);
  const timeText = reminder.nextFireAt
    ? formatReminderDate(reminder.nextFireAt)
    : formatReminderDate(reminder.dueAt);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
        overdue
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{reminder.title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getReminderStatusColor(reminder.status)}`}
            >
              {reminder.status}
            </span>
          </div>
          {reminder.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {reminder.description}
            </p>
          )}
          {reminder.accountName && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Account: {reminder.accountName}
            </p>
          )}
          {reminder.amountCents !== null && reminder.amountCents !== undefined && (
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(reminder.amountCents, currency)}
            </p>
          )}
          <p className={`mt-2 text-xs ${overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {timeText}
          </p>
        </div>
      </div>
      {(onSnooze ?? onDismiss) && (
        <div className="mt-3 flex gap-2">
          {onSnooze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(reminder.id);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Snooze
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(reminder.id);
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

