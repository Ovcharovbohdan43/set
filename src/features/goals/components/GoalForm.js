import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useCategoriesQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';
import { useCreateGoalMutation, useUpdateGoalMutation } from '../hooks';
export function GoalForm({ open, onOpenChange, goal, currency = 'USD' }) {
    const isEditing = !!goal;
    const categoriesQuery = useCategoriesQuery();
    const createMutation = useCreateGoalMutation();
    const updateMutation = useUpdateGoalMutation();
    const [formData, setFormData] = useState({
        name: goal?.name ?? '',
        targetCents: goal?.targetCents ?? 0,
        targetDate: goal?.targetDate ?? null,
        categoryId: goal?.categoryId ?? null,
        priority: goal?.priority ?? 0,
        status: goal?.status ?? 'active'
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: goal.id,
                    ...formData
                });
            }
            else {
                await createMutation.mutateAsync(formData);
            }
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to save goal', error);
        }
    };
    const allCategories = categoriesQuery.data ?? [];
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" }), _jsxs(Dialog.Content, { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800", children: [_jsx(Dialog.Title, { className: "text-2xl font-semibold text-slate-900 dark:text-slate-100", children: isEditing ? 'Edit Goal' : 'Create Goal' }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Name" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: ["Target Amount (", currency, ")"] }), _jsx("input", { type: "number", step: "0.01", required: true, min: "0", value: formData.targetCents / 100, onChange: (e) => setFormData({
                                                ...formData,
                                                targetCents: parseInputAmount(e.target.value)
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Target Date (optional)" }), _jsx("input", { type: "date", value: formData.targetDate ? formData.targetDate.slice(0, 10) : '', onChange: (e) => setFormData({
                                                ...formData,
                                                targetDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Category (optional)" }), _jsxs("select", { value: formData.categoryId ?? '', onChange: (e) => setFormData({
                                                ...formData,
                                                categoryId: e.target.value || null
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "", children: "None" }), allCategories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Priority" }), _jsx("input", { type: "number", min: "0", value: formData.priority ?? 0, onChange: (e) => setFormData({
                                                        ...formData,
                                                        priority: Number.parseInt(e.target.value, 10) || 0
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Status" }), _jsxs("select", { value: formData.status ?? 'active', onChange: (e) => setFormData({
                                                        ...formData,
                                                        status: e.target.value
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "paused", children: "Paused" }), _jsx("option", { value: "achieved", children: "Achieved" }), _jsx("option", { value: "abandoned", children: "Abandoned" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx(Dialog.Close, { asChild: true, children: _jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700", children: "Cancel" }) }), _jsx("button", { type: "submit", disabled: createMutation.isPending || updateMutation.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50", children: createMutation.isPending || updateMutation.isPending
                                                ? 'Saving...'
                                                : isEditing
                                                    ? 'Update'
                                                    : 'Create' })] })] })] })] }) }));
}
