import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useCategoriesQuery } from '@/features/transactions/hooks';
import { parseInputAmount } from '@/features/transactions/utils/money';
import { useCreateBudgetMutation, useUpdateBudgetMutation } from '../hooks';
export function BudgetForm({ open, onOpenChange, budget, currency = 'USD' }) {
    const isEditing = !!budget;
    const categoriesQuery = useCategoriesQuery();
    const createMutation = useCreateBudgetMutation();
    const updateMutation = useUpdateBudgetMutation();
    const [formData, setFormData] = useState({
        name: budget?.name ?? '',
        period: budget?.period ?? 'monthly',
        budgetType: budget?.budgetType ?? 'envelope',
        categoryId: budget?.categoryId ?? null,
        amountCents: budget?.amountCents ?? 0,
        startDate: budget?.startDate ?? new Date().toISOString(),
        endDate: budget?.endDate ?? new Date().toISOString(),
        rollover: budget?.rollover ?? false,
        alertThreshold: budget?.alertThreshold ?? 0.8
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: budget.id,
                    ...formData
                });
            }
            else {
                await createMutation.mutateAsync(formData);
            }
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to save budget', error);
        }
    };
    const expenseCategories = categoriesQuery.data?.filter((c) => c.type === 'expense') ?? [];
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" }), _jsxs(Dialog.Content, { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800", children: [_jsx(Dialog.Title, { className: "text-2xl font-semibold text-slate-900 dark:text-slate-100", children: isEditing ? 'Edit Budget' : 'Create Budget' }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Name" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Period" }), _jsxs("select", { value: formData.period, onChange: (e) => setFormData({ ...formData, period: e.target.value }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "quarterly", children: "Quarterly" }), _jsx("option", { value: "yearly", children: "Yearly" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Type" }), _jsxs("select", { value: formData.budgetType, onChange: (e) => setFormData({ ...formData, budgetType: e.target.value }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "envelope", children: "Envelope" }), _jsx("option", { value: "overall", children: "Overall" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Category (optional)" }), _jsxs("select", { value: formData.categoryId ?? '', onChange: (e) => setFormData({
                                                ...formData,
                                                categoryId: e.target.value || null
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100", children: [_jsx("option", { value: "", children: "None" }), expenseCategories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: ["Amount (", currency, ")"] }), _jsx("input", { type: "number", step: "0.01", required: true, min: "0", value: formData.amountCents / 100, onChange: (e) => setFormData({
                                                ...formData,
                                                amountCents: parseInputAmount(e.target.value)
                                            }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Start Date" }), _jsx("input", { type: "datetime-local", required: true, value: formData.startDate.slice(0, 16), onChange: (e) => setFormData({
                                                        ...formData,
                                                        startDate: new Date(e.target.value).toISOString()
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "End Date" }), _jsx("input", { type: "datetime-local", required: true, value: formData.endDate.slice(0, 16), onChange: (e) => setFormData({
                                                        ...formData,
                                                        endDate: new Date(e.target.value).toISOString()
                                                    }), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: formData.rollover, onChange: (e) => setFormData({ ...formData, rollover: e.target.checked }), className: "rounded border-slate-300 dark:border-slate-600" }), _jsx("span", { className: "text-sm text-slate-700 dark:text-slate-300", children: "Rollover" })] }), _jsxs("div", { className: "flex-1", children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: ["Alert Threshold (", Math.round((formData.alertThreshold ?? 0.8) * 100), "%)"] }), _jsx("input", { type: "range", min: "0", max: "1", step: "0.1", value: formData.alertThreshold ?? 0.8, onChange: (e) => setFormData({
                                                        ...formData,
                                                        alertThreshold: Number.parseFloat(e.target.value)
                                                    }), className: "mt-1 w-full" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx(Dialog.Close, { asChild: true, children: _jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700", children: "Cancel" }) }), _jsx("button", { type: "submit", disabled: createMutation.isPending || updateMutation.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50", children: createMutation.isPending || updateMutation.isPending
                                                ? 'Saving...'
                                                : isEditing
                                                    ? 'Update'
                                                    : 'Create' })] })] })] })] }) }));
}
