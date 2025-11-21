import type { GoalStatus } from './schema';

export function getGoalStatusColor(status: GoalStatus): string {
  switch (status) {
    case 'active':
      return 'text-blue-600 dark:text-blue-400';
    case 'paused':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'achieved':
      return 'text-green-600 dark:text-green-400';
    case 'abandoned':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

export function getGoalStatusBgColor(status: GoalStatus): string {
  switch (status) {
    case 'active':
      return 'bg-blue-50 dark:bg-blue-900/20';
    case 'paused':
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    case 'achieved':
      return 'bg-green-50 dark:bg-green-900/20';
    case 'abandoned':
      return 'bg-red-50 dark:bg-red-900/20';
    default:
      return 'bg-slate-50 dark:bg-slate-800';
  }
}

export function formatDaysRemaining(days: number | null | undefined): string {
  if (days === null || days === undefined) {
    return 'No target date';
  }
  if (days < 0) {
    return 'Overdue';
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return '1 day left';
  }
  return `${days} days left`;
}

