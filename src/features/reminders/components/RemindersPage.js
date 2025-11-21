import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useRemindersQuery, useDeleteReminderMutation, useSnoozeReminderMutation, useUpdateReminderMutation } from '../hooks';
import { ReminderCard } from './ReminderCard';
import { ReminderForm } from './ReminderForm';
export function RemindersPage() {
    const remindersQuery = useRemindersQuery();
    const deleteMutation = useDeleteReminderMutation();
    const snoozeMutation = useSnoozeReminderMutation();
    const updateMutation = useUpdateReminderMutation();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState();
    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        setFormOpen(true);
    };
    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this reminder?')) {
            try {
                await deleteMutation.mutateAsync(id);
            }
            catch (error) {
                console.error('Failed to delete reminder', error);
            }
        }
    };
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
            await updateMutation.mutateAsync({
                id,
                status: 'dismissed'
            });
        }
        catch (error) {
            console.error('Failed to dismiss reminder', error);
        }
    };
    const handleFormClose = () => {
        setFormOpen(false);
        setEditingReminder(undefined);
    };
    if (remindersQuery.isLoading) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300", children: "Loading reminders..." }));
    }
    if (remindersQuery.isError) {
        return (_jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300", children: "Error loading reminders. Please try again." }));
    }
    const reminders = remindersQuery.data ?? [];
    const scheduled = reminders.filter((r) => r.status === 'scheduled');
    const sent = reminders.filter((r) => r.status === 'sent');
    const snoozed = reminders.filter((r) => r.status === 'snoozed');
    const dismissed = reminders.filter((r) => r.status === 'dismissed');
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-slate-100", children: "Reminders" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Manage your payment reminders and notifications" })] }), _jsx("button", { onClick: () => setFormOpen(true), className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "+ New Reminder" })] }), reminders.length === 0 ? (_jsxs("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "No reminders yet. Create your first reminder to stay on top of payments." }), _jsx("button", { onClick: () => setFormOpen(true), className: "mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "Create Reminder" })] })) : (_jsxs("div", { className: "space-y-6", children: [scheduled.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100", children: ["Scheduled (", scheduled.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: scheduled.map((reminder) => (_jsxs("div", { className: "group relative", children: [_jsx(ReminderCard, { reminder: reminder, onClick: () => handleEdit(reminder), onSnooze: handleSnooze, onDismiss: handleDismiss }), _jsxs("div", { className: "absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleEdit(reminder);
                                                    }, className: "rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800", children: "Edit" }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        void handleDelete(reminder.id);
                                                    }, className: "rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30", children: "Delete" })] })] }, reminder.id))) })] })), snoozed.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100", children: ["Snoozed (", snoozed.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: snoozed.map((reminder) => (_jsx(ReminderCard, { reminder: reminder, onClick: () => handleEdit(reminder), onSnooze: handleSnooze, onDismiss: handleDismiss }, reminder.id))) })] })), sent.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100", children: ["Sent (", sent.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: sent.map((reminder) => (_jsx(ReminderCard, { reminder: reminder, onClick: () => handleEdit(reminder) }, reminder.id))) })] })), dismissed.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100", children: ["Dismissed (", dismissed.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: dismissed.map((reminder) => (_jsx(ReminderCard, { reminder: reminder, onClick: () => handleEdit(reminder) }, reminder.id))) })] }))] })), _jsx(ReminderForm, { open: isFormOpen, onOpenChange: handleFormClose, reminder: editingReminder })] }));
}
