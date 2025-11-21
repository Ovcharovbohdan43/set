import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/features/transactions/utils/money';
import { TransactionFormView } from '@/features/transactions/components/TransactionForm';
import { useAccountsQuery, useCategoriesQuery, useCreateTransactionMutation } from '@/features/transactions/hooks';
import { useDashboardInvalidation, useDashboardSnapshot } from '../hooks';
import { calculatePercent } from '../utils';
const EMPTY_SNAPSHOT = {
    currency: 'USD',
    netWorthCents: 0,
    netWorthDeltaCents: 0,
    cashFlowCents: 0,
    cashFlowPreviousCents: 0,
    budgetTotalCents: 1,
    budgetSpentCents: 0,
    weeklySpending: Array.from({ length: 7 }).map(() => ({
        date: '',
        amountCents: 0
    })),
    accounts: []
};
export function DashboardPage() {
    const navigate = useNavigate();
    const { data, isLoading, isFetching, refetch } = useDashboardSnapshot();
    useDashboardInvalidation();
    const snapshot = data ?? EMPTY_SNAPSHOT;
    const [isQuickAddOpen, setQuickAddOpen] = useState(false);
    const [isPaletteOpen, setPaletteOpen] = useState(false);
    const [isShortcutsOpen, setShortcutsOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState('');
    const isOffline = useAppStore((state) => state.isOffline);
    const transactionFilters = useAppStore((state) => state.transactionFilters);
    const accountsQuery = useAccountsQuery();
    const categoriesQuery = useCategoriesQuery();
    const { mutateAsync: createTransaction, isPending: isCreating } = useCreateTransactionMutation(transactionFilters);
    useEffect(() => {
        const handler = (event) => {
            const key = event.key.toLowerCase();
            const isMod = event.metaKey || event.ctrlKey;
            if (isMod && key === 'k') {
                event.preventDefault();
                setPaletteOpen(true);
            }
            if (isMod && key === 'n') {
                event.preventDefault();
                setQuickAddOpen(true);
            }
            if (isMod && event.shiftKey && key === 'b') {
                event.preventDefault();
                alert('Budget builder arrives in Stage 4. Stay tuned!');
            }
            if (isMod && key === '/') {
                event.preventDefault();
                setShortcutsOpen(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);
    const currency = snapshot.currency ?? 'USD';
    const netWorth = formatCurrency(snapshot.netWorthCents, currency);
    const netDelta = formatCurrency(snapshot.netWorthDeltaCents, currency);
    const cashFlow = formatCurrency(snapshot.cashFlowCents, currency);
    const cashDelta = formatCurrency(snapshot.cashFlowCents - snapshot.cashFlowPreviousCents, currency);
    const budgetPercent = calculatePercent(snapshot.budgetSpentCents, snapshot.budgetTotalCents);
    const actions = [
        {
            id: 'new-transaction',
            label: 'Add transaction',
            onSelect: () => {
                setQuickAddOpen(true);
                setPaletteOpen(false);
            },
            shortcut: 'Ctrl + N'
        },
        {
            id: 'open-transactions',
            label: 'Go to transactions workspace',
            onSelect: () => {
                navigate('/transactions');
                setPaletteOpen(false);
            },
            shortcut: 'G'
        },
        {
            id: 'refresh',
            label: 'Refresh dashboard data',
            onSelect: () => {
                void refetch();
                setPaletteOpen(false);
            },
            shortcut: 'R'
        },
        {
            id: 'goal',
            label: 'Add goal (coming soon)',
            onSelect: () => {
                alert('Goal creation flows will ship with Stage 5.');
                setPaletteOpen(false);
            },
            shortcut: 'Ctrl + Shift + G'
        }
    ];
    const filteredActions = actions.filter((action) => action.label.toLowerCase().includes(paletteQuery.toLowerCase()));
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-500", children: "Stage 3" }), _jsx("h2", { className: "text-2xl font-semibold text-slate-900 dark:text-white", children: "Financial cockpit" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Net worth, cash flow, budgets, and weekly spend in one glance." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [isOffline ? (_jsx("span", { className: "rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300", children: "Offline mode" })) : null, _jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", onClick: () => refetch(), disabled: isFetching, children: isFetching ? 'Refreshing…' : 'Refresh' }), _jsx("button", { type: "button", className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", onClick: () => setPaletteOpen(true), children: "Command palette (Ctrl + K)" })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(KpiCard, { title: "Net worth", value: netWorth, delta: netDelta, isLoading: isLoading && !data, trend: snapshot.netWorthDeltaCents }), _jsx(KpiCard, { title: "30d cash flow", value: cashFlow, delta: cashDelta, isLoading: isLoading && !data, trend: snapshot.cashFlowCents - snapshot.cashFlowPreviousCents }), _jsx(BudgetCard, { total: snapshot.budgetTotalCents, spent: snapshot.budgetSpentCents, percent: budgetPercent, currency: currency, isLoading: isLoading && !data })] }), _jsx(QuickActions, { onAddTransaction: () => setQuickAddOpen(true), onAddGoal: () => alert('Goal creation flows arrive with Stage 5.') }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[2fr,1fr]", children: [_jsx(WeeklySpendingCard, { data: snapshot.weeklySpending, currency: currency, isLoading: isLoading && !data }), _jsx(AccountsPanel, { accounts: snapshot.accounts, currency: currency, isLoading: isLoading && !data })] }), _jsx(CommandPaletteDialog, { open: isPaletteOpen, onOpenChange: setPaletteOpen, query: paletteQuery, onQueryChange: setPaletteQuery, actions: filteredActions }), _jsx(ShortcutsDialog, { open: isShortcutsOpen, onOpenChange: setShortcutsOpen }), _jsx(QuickTransactionDialog, { open: isQuickAddOpen, onOpenChange: setQuickAddOpen, accounts: accountsQuery.data ?? [], categories: categoriesQuery.data ?? [], isSubmitting: isCreating, onSubmit: async (values) => {
                    try {
                        await createTransaction(values);
                        setQuickAddOpen(false);
                    }
                    catch (error) {
                        let message = 'Unknown error';
                        if (error instanceof Error) {
                            message = error.message;
                        }
                        else if (typeof error === 'string') {
                            message = error;
                        }
                        else {
                            try {
                                message = JSON.stringify(error);
                            }
                            catch {
                                message = String(error);
                            }
                        }
                        console.error('Failed to create transaction', message);
                    }
                } })] }));
}
function KpiCard({ title, value, delta, trend, isLoading }) {
    if (isLoading) {
        return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70", children: [_jsx("div", { className: "h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-4 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-2 h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" })] }));
    }
    const trendClass = trend === 0
        ? 'text-slate-500'
        : trend > 0
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-rose-600 dark:text-rose-300';
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: title }), _jsx("p", { className: "mt-2 text-3xl font-semibold text-slate-900 dark:text-white", children: value }), _jsxs("p", { className: `mt-1 text-sm font-medium ${trendClass}`, children: [trend > 0 ? '▲' : trend < 0 ? '▼' : '●', " ", delta] })] }));
}
function BudgetCard({ total, spent, percent, currency, isLoading }) {
    if (isLoading) {
        return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("div", { className: "h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-4 h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-3 h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" })] }));
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Budget burn" }), _jsxs("p", { className: "mt-2 text-3xl font-semibold text-slate-900 dark:text-white", children: [formatCurrency(spent, currency), " / ", formatCurrency(total, currency)] }), _jsx("div", { className: "mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800", children: _jsx("div", { className: `h-3 rounded-full ${percent >= 90 ? 'bg-rose-500' : 'bg-primary'}`, style: { width: `${percent}%` } }) }), _jsxs("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: [percent, "% of tracked envelopes have been used this period."] })] }));
}
function QuickActions({ onAddGoal, onAddTransaction }) {
    return (_jsxs("div", { className: "grid gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:grid-cols-2", children: [_jsxs("button", { type: "button", className: "flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 text-left text-slate-800 transition hover:border-primary/40 dark:border-slate-700 dark:text-slate-100", onClick: onAddTransaction, children: [_jsxs("span", { children: [_jsx("strong", { className: "block text-base", children: "Add transaction" }), _jsx("span", { className: "text-sm text-slate-500", children: "Ctrl + N" })] }), _jsx("span", { className: "text-2xl", children: "\uFF0B" })] }), _jsxs("button", { type: "button", className: "flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-slate-800 transition hover:border-primary/40 dark:border-slate-700 dark:text-slate-100", onClick: onAddGoal, children: [_jsxs("span", { children: [_jsx("strong", { className: "block text-base", children: "Add goal" }), _jsx("span", { className: "text-sm text-slate-500", children: "Ctrl + Shift + G" })] }), _jsx("span", { className: "text-2xl", children: "\uD83C\uDFAF" })] })] }));
}
function WeeklySpendingCard({ data, currency, isLoading }) {
    if (isLoading) {
        return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-6 h-40 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" })] }));
    }
    const max = Math.max(...data.map((point) => point.amountCents), 1);
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Weekly spend" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: formatCurrency(data.reduce((sum, point) => sum + point.amountCents, 0), currency) })] }) }), _jsx("div", { className: "mt-6 flex h-40 items-end gap-3", children: data.map((point, index) => {
                    const ratio = point.amountCents / max;
                    const date = point.date ? new Date(point.date) : null;
                    const label = date
                        ? date.toLocaleDateString(undefined, { weekday: 'short' })
                        : '—';
                    return (_jsxs("div", { className: "flex flex-1 flex-col", children: [_jsx("div", { className: "rounded-full bg-primary/30 dark:bg-primary/60", style: { height: `${Math.max(ratio * 100, 4)}%` }, title: formatCurrency(point.amountCents, currency) }), _jsx("span", { className: "mt-2 text-center text-xs uppercase text-slate-500", children: label })] }, `${point.date}-${index}`));
                }) })] }));
}
function AccountsPanel({ accounts, currency, isLoading }) {
    if (isLoading) {
        return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("div", { className: "h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" }), _jsx("div", { className: "mt-4 space-y-3", children: [0, 1, 2].map((index) => (_jsx("div", { className: "h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" }, index))) })] }));
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Top accounts" }), _jsx("ul", { className: "mt-4 space-y-3", children: accounts.length ? (accounts.map((account) => (_jsxs("li", { className: "flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: account.name }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: account.accountType ?? '—' })] }), _jsx("p", { className: "text-sm font-medium text-slate-900 dark:text-white", children: formatCurrency(account.balanceCents, currency) })] }, account.id)))) : (_jsx("li", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Seed at least one account to view highlights." })) })] }));
}
function QuickTransactionDialog({ open, onOpenChange, accounts, categories, isSubmitting, onSubmit }) {
    const defaultValues = useMemo(() => {
        const [firstAccount] = accounts ?? [];
        if (!firstAccount)
            return undefined;
        return {
            accountId: firstAccount.id,
            categoryId: null,
            type: 'expense',
            amountCents: 0,
            currency: firstAccount.currency ?? 'USD',
            occurredOn: new Date().toISOString(),
            notes: '',
            tags: [],
            cleared: false,
            goalId: null
        };
    }, [accounts]);
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 bg-slate-900/60" }), _jsx(Dialog.Content, { className: "fixed inset-0 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx(Dialog.Title, { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Quick add transaction" }), _jsx(Dialog.Close, { className: "rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800", children: "\u2715" })] }), accounts?.length ? (_jsx(TransactionFormView, { accounts: accounts, categories: categories ?? [], defaultValues: defaultValues, submitLabel: isSubmitting ? 'Saving…' : 'Create', onCancel: () => onOpenChange(false), onSubmit: (values) => {
                                    onSubmit(values).catch((error) => {
                                        const message = error instanceof Error ? error.message : String(error);
                                        console.error('Failed to submit quick transaction form', message);
                                    });
                                } })) : (_jsx("p", { className: "text-sm text-slate-500", children: "Seed an account first (run `pnpm tsx scripts/seed.ts`) to enable quick add." }))] }) })] }) }));
}
function CommandPaletteDialog({ open, onOpenChange, actions, query, onQueryChange }) {
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm" }), _jsx(Dialog.Content, { className: "fixed inset-0 flex items-start justify-center p-4", children: _jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900", children: [_jsx("input", { autoFocus: true, value: query, onChange: (event) => onQueryChange(event.target.value), placeholder: "Type a command or search...", className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800" }), _jsx("ul", { className: "mt-4 max-h-64 overflow-y-auto", children: actions.length ? (actions.map((action) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800", onClick: action.onSelect, children: [action.label, action.shortcut ? (_jsx("span", { className: "text-xs text-slate-400", children: action.shortcut })) : null] }) }, action.id)))) : (_jsx("li", { className: "px-3 py-2 text-sm text-slate-500", children: "No matching commands" })) })] }) })] }) }));
}
function ShortcutsDialog({ open, onOpenChange }) {
    const shortcuts = [
        { combo: 'Ctrl + N', description: 'Add transaction' },
        { combo: 'Ctrl + K', description: 'Open command palette' },
        { combo: 'Ctrl + Shift + B', description: 'Budget shortcut (Stage 4)' },
        { combo: 'Ctrl + /', description: 'Show shortcuts' }
    ];
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 bg-slate-900/50" }), _jsx(Dialog.Content, { className: "fixed inset-0 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx(Dialog.Title, { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Keyboard shortcuts" }), _jsx(Dialog.Close, { className: "rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800", children: "\u2715" })] }), _jsx("ul", { className: "space-y-3", children: shortcuts.map((shortcut) => (_jsxs("li", { className: "flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800", children: [_jsx("span", { className: "font-mono text-slate-700 dark:text-slate-200", children: shortcut.combo }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: shortcut.description })] }, shortcut.combo))) })] }) })] }) }));
}
