import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useBudgetsQuery, useDeleteBudgetMutation } from '../hooks';
import { BudgetCard } from './BudgetCard';
import { BudgetForm } from './BudgetForm';
export function BudgetsPage() {
    const budgetsQuery = useBudgetsQuery();
    const deleteMutation = useDeleteBudgetMutation();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState();
    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormOpen(true);
    };
    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this budget?')) {
            try {
                await deleteMutation.mutateAsync(id);
            }
            catch (error) {
                console.error('Failed to delete budget', error);
            }
        }
    };
    const handleFormClose = () => {
        setFormOpen(false);
        setEditingBudget(undefined);
    };
    if (budgetsQuery.isLoading) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300", children: "Loading budgets..." }));
    }
    if (budgetsQuery.isError) {
        return (_jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300", children: "Error loading budgets. Please try again." }));
    }
    const budgets = budgetsQuery.data ?? [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-slate-100", children: "Budgets" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Track your spending and stay on budget" })] }), _jsx("button", { onClick: () => setFormOpen(true), className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "+ New Budget" })] }), budgets.length === 0 ? (_jsxs("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "No budgets yet. Create your first budget to start tracking your spending." }), _jsx("button", { onClick: () => setFormOpen(true), className: "mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "Create Budget" })] })) : (_jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3", children: budgets.map((budget) => (_jsxs("div", { className: "group relative", children: [_jsx(BudgetCard, { budget: budget, onClick: () => handleEdit(budget) }), _jsxs("div", { className: "absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleEdit(budget);
                                    }, className: "rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800", children: "Edit" }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        void handleDelete(budget.id);
                                    }, className: "rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30", children: "Delete" })] })] }, budget.id))) })), _jsx(BudgetForm, { open: isFormOpen, onOpenChange: handleFormClose, budget: editingBudget })] }));
}
