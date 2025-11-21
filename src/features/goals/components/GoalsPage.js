import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useGoalsQuery, useDeleteGoalMutation, useUpdateGoalStatusMutation } from '../hooks';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
const STATUS_COLUMNS = [
    { status: 'active', label: 'Active' },
    { status: 'paused', label: 'Paused' },
    { status: 'achieved', label: 'Achieved' },
    { status: 'abandoned', label: 'Abandoned' }
];
export function GoalsPage() {
    const goalsQuery = useGoalsQuery();
    const deleteMutation = useDeleteGoalMutation();
    const updateStatusMutation = useUpdateGoalStatusMutation();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState();
    const goalsByStatus = useMemo(() => {
        const grouped = {
            active: [],
            paused: [],
            achieved: [],
            abandoned: []
        };
        goalsQuery.data?.forEach((goal) => {
            grouped[goal.status].push(goal);
        });
        // Sort by priority (descending) within each status
        Object.values(grouped).forEach((goals) => {
            goals.sort((a, b) => b.priority - a.priority);
        });
        return grouped;
    }, [goalsQuery.data]);
    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormOpen(true);
    };
    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            try {
                await deleteMutation.mutateAsync(id);
            }
            catch (error) {
                console.error('Failed to delete goal', error);
            }
        }
    };
    const handleStatusChange = async (goalId, newStatus) => {
        try {
            await updateStatusMutation.mutateAsync({ id: goalId, status: newStatus });
        }
        catch (error) {
            console.error('Failed to update goal status', error);
        }
    };
    const handleFormClose = () => {
        setFormOpen(false);
        setEditingGoal(undefined);
    };
    if (goalsQuery.isLoading) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300", children: "Loading goals..." }));
    }
    if (goalsQuery.isError) {
        return (_jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300", children: "Error loading goals. Please try again." }));
    }
    const totalGoals = goalsQuery.data?.length ?? 0;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-slate-100", children: "Goals" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Track your savings goals and milestones" })] }), _jsx("button", { onClick: () => setFormOpen(true), className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "+ New Goal" })] }), totalGoals === 0 ? (_jsxs("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-12 text-center dark:border-slate-700/70", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "No goals yet. Create your first goal to start tracking your savings." }), _jsx("button", { onClick: () => setFormOpen(true), className: "mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "Create Goal" })] })) : (_jsx("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-4", children: STATUS_COLUMNS.map(({ status, label }) => {
                    const goals = goalsByStatus[status];
                    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: label }), _jsx("span", { className: "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300", children: goals.length })] }), _jsx("div", { className: "space-y-3", children: goals.map((goal) => (_jsxs("div", { className: "group relative", children: [_jsx(GoalCard, { goal: goal, onClick: () => handleEdit(goal) }), _jsxs("div", { className: "absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx("select", { value: goal.status, onChange: (e) => handleStatusChange(goal.id, e.target.value), onClick: (e) => e.stopPropagation(), className: "rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700", children: STATUS_COLUMNS.map(({ status: s, label: l }) => (_jsx("option", { value: s, children: l }, s))) }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        void handleDelete(goal.id);
                                                    }, className: "rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30", children: "Delete" })] })] }, goal.id))) })] }, status));
                }) })), _jsx(GoalForm, { open: isFormOpen, onOpenChange: handleFormClose, goal: editingGoal })] }));
}
