import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAccountsQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';
import { useCreateReminderMutation, useUpdateReminderMutation } from '../hooks';
export function ReminderForm({ open, onOpenChange, reminder, currency = 'USD' }) {
    const isEditing = !!reminder;
    const accountsQuery = useAccountsQuery();
    const createMutation = useCreateReminderMutation();
    const updateMutation = useUpdateReminderMutation();
    const [formData, setFormData] = useState({
        title: reminder?.title ?? '',
        description: reminder?.description ?? null,
        accountId: reminder?.accountId ?? null,
        amountCents: reminder?.amountCents ?? null,
        dueAt: reminder?.dueAt ?? new Date().toISOString(),
        recurrenceRule: reminder?.recurrenceRule ?? null,
        channel: reminder?.channel ?? 'toast',
        snoozeMinutes: reminder?.snoozeMinutes ?? null
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: reminder.id,
                    ...formData
                });
            }
            else {
                await createMutation.mutateAsync(formData);
            }
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to save reminder', error);
        }
    };
    const accounts = accountsQuery.data ?? [];
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" }), _jsxs(Dialog.Content, { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800", children: [_jsx(Dialog.Title, { className: "text-2xl font-semibold text-slate-900 dark:text-slate-100", children: isEditing ? 'Edit Reminder' : 'Create Reminder' }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Title *" }), _jsx("input", { type: "text", required: true, value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Description" }), _jsx("textarea", { value: formData.description ?? '', onChange: (e) => setFormData({
                                                ...formData,
                                                description: e.target.value || null
                                            }), rows: 3, className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Account (optional)" }), _jsxs("select", { value: formData.accountId ?? '', onChange: (e) => setFormData({
                                                        ...formData,
                                                        accountId: e.target.value || null
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "", children: "None" }), accounts.map((acc) => (_jsx("option", { value: acc.id, children: acc.name }, acc.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: ["Amount (", currency, ")"] }), _jsx("input", { type: "number", step: "0.01", min: "0", value: formData.amountCents ? formData.amountCents / 100 : '', onChange: (e) => setFormData({
                                                        ...formData,
                                                        amountCents: e.target.value ? parseInputAmount(e.target.value) : null
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Due Date & Time *" }), _jsx("input", { type: "datetime-local", required: true, value: formData.dueAt.slice(0, 16), onChange: (e) => setFormData({
                                                ...formData,
                                                dueAt: new Date(e.target.value).toISOString()
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Recurrence (optional)" }), _jsxs("select", { value: formData.recurrenceRule ?? '', onChange: (e) => setFormData({
                                                        ...formData,
                                                        recurrenceRule: e.target.value || null
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "DAILY", children: "Daily" }), _jsx("option", { value: "WEEKLY", children: "Weekly" }), _jsx("option", { value: "MONTHLY", children: "Monthly" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Channel" }), _jsxs("select", { value: formData.channel ?? 'toast', onChange: (e) => setFormData({
                                                        ...formData,
                                                        channel: e.target.value
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "toast", children: "Toast" }), _jsx("option", { value: "in_app", children: "In-App" }), _jsx("option", { value: "email", children: "Email" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx(Dialog.Close, { asChild: true, children: _jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700", children: "Cancel" }) }), _jsx("button", { type: "submit", disabled: createMutation.isPending || updateMutation.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50", children: createMutation.isPending || updateMutation.isPending
                                                ? 'Saving...'
                                                : isEditing
                                                    ? 'Update'
                                                    : 'Create' })] })] })] })] }) }));
}
