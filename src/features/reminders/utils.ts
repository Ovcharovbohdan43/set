import type { ReminderStatus } from './schema';

export function getReminderStatusColor(status: ReminderStatus): string {
  switch (status) {
    case 'scheduled':
      return 'text-blue-600 dark:text-blue-400';
    case 'sent':
      return 'text-green-600 dark:text-green-400';
    case 'snoozed':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'dismissed':
      return 'text-slate-600 dark:text-slate-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

export function formatReminderDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) {
      return 'Overdue';
    }
    if (diffMins < 60) {
      return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    }
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    if (diffDays < 7) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

