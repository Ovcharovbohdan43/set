import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency } from '@/features/transactions/utils/money';
import { formatReminderDate, getReminderStatusColor, isOverdue } from '../utils';
export function ReminderCard({ reminder, currency = 'USD', onClick, onSnooze, onDismiss }) {
    const overdue = isOverdue(reminder.nextFireAt ?? reminder.dueAt);
    const timeText = reminder.nextFireAt
        ? formatReminderDate(reminder.nextFireAt)
        : formatReminderDate(reminder.dueAt);
    return (_jsxs("div", { onClick: onClick, className: `rounded-xl border p-4 shadow-sm transition hover:shadow-md ${overdue
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'} ${onClick ? 'cursor-pointer' : ''}`, children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-semibold text-slate-900 dark:text-slate-100", children: reminder.title }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${getReminderStatusColor(reminder.status)}`, children: reminder.status })] }), reminder.description && (_jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-400", children: reminder.description })), reminder.accountName && (_jsxs("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: ["Account: ", reminder.accountName] })), reminder.amountCents !== null && reminder.amountCents !== undefined && (_jsx("p", { className: "mt-1 text-sm font-medium text-slate-900 dark:text-slate-100", children: formatCurrency(reminder.amountCents, currency) })), _jsx("p", { className: `mt-2 text-xs ${overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`, children: timeText })] }) }), (onSnooze ?? onDismiss) && (_jsxs("div", { className: "mt-3 flex gap-2", children: [onSnooze && (_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            onSnooze(reminder.id);
                        }, className: "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700", children: "Snooze" })), onDismiss && (_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            onDismiss(reminder.id);
                        }, className: "rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600", children: "Dismiss" }))] }))] }));
}
