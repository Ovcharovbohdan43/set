import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as Dialog from '@radix-ui/react-dialog';
import { useDueRemindersQuery, useMarkReminderSentMutation, useSnoozeReminderMutation } from '../hooks';
import { ReminderCard } from './ReminderCard';
export function NotificationCenter({ open, onOpenChange }) {
    const dueRemindersQuery = useDueRemindersQuery();
    const markSentMutation = useMarkReminderSentMutation();
    const snoozeMutation = useSnoozeReminderMutation();
    const handleSnooze = async (id) => {
        try {
            await snoozeMutation.mutateAsync({ id, snoozeMinutes: 15 });
        }
        catch (error) {
            console.error('Failed to snooze reminder', error);
        }
    };
    const handleDismiss = async (id) => {
        try {
            await markSentMutation.mutateAsync(id);
        }
        catch (error) {
            console.error('Failed to mark reminder as sent', error);
        }
    };
    const dueReminders = dueRemindersQuery.data ?? [];
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" }), _jsx(Dialog.Content, { className: "fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsx("div", { className: "border-b border-slate-200 p-4 dark:border-slate-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Dialog.Title, { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Notifications" }), _jsx(Dialog.Close, { asChild: true, children: _jsx("button", { className: "rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700", children: _jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }) })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: dueRemindersQuery.isLoading ? (_jsx("div", { className: "text-center text-sm text-slate-500 dark:text-slate-400", children: "Loading..." })) : dueReminders.length === 0 ? (_jsx("div", { className: "text-center text-sm text-slate-500 dark:text-slate-400", children: "No notifications" })) : (_jsx("div", { className: "space-y-3", children: dueReminders.map((reminder) => (_jsx(ReminderCard, { reminder: reminder, onSnooze: handleSnooze, onDismiss: handleDismiss }, reminder.id))) })) })] }) })] }) }));
}
