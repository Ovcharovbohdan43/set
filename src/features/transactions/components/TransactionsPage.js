import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAppStore } from '@/store';
import { TransactionFormView } from './TransactionForm';
import { TransactionsTable } from './TransactionTable';
import { useAccountsQuery, useCategoriesQuery, useCreateTransactionMutation, useDeleteTransactionMutation, useImportTransactionsMutation, useTransactionsQuery, useUpdateTransactionMutation } from '../hooks';
export function TransactionsPage() {
    const filters = useAppStore((state) => state.transactionFilters);
    const setFilters = useAppStore((state) => state.setTransactionFilters);
    const accountsQuery = useAccountsQuery();
    const categoriesQuery = useCategoriesQuery();
    const transactionsQuery = useTransactionsQuery(filters);
    const createMutation = useCreateTransactionMutation(filters);
    const updateMutation = useUpdateTransactionMutation(filters);
    const deleteMutation = useDeleteTransactionMutation(filters);
    const importMutation = useImportTransactionsMutation(filters);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    const transactions = transactionsQuery.data ?? [];
    const dialogTitle = editing ? 'Edit transaction' : 'Add transaction';
    const defaultFormValues = useMemo(() => {
        if (editing) {
            return transactionToForm(editing);
        }
        if (!accounts.length) {
            return undefined;
        }
        return {
            accountId: filters.accountId ?? accounts[0]?.id ?? '',
            categoryId: null,
            type: 'expense',
            amountCents: 0,
            currency: 'USD',
            occurredOn: new Date().toISOString(),
            notes: '',
            tags: [],
            cleared: false,
            goalId: null
        };
    }, [accounts, editing, filters.accountId]);
    const handleFormSubmit = async (values) => {
        try {
            if (editing) {
                await updateMutation.mutateAsync({ ...values, id: editing.id });
            }
            else {
                await createMutation.mutateAsync(values);
            }
            setDialogOpen(false);
            setEditing(null);
        }
        catch (error) {
            console.error(error);
        }
    };
    const handleInlineUpdate = (transaction, patch) => {
        updateMutation.mutate({ ...transactionToForm(transaction), ...patch, id: transaction.id });
    };
    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };
    const handleImportSample = () => {
        const primaryAccount = accounts[0];
        if (!primaryAccount)
            return;
        const accountId = primaryAccount.id;
        importMutation.mutate([
            {
                accountId,
                categoryId: categories[0]?.id ?? null,
                type: 'expense',
                amountCents: 4500,
                currency: 'USD',
                occurredOn: new Date().toISOString(),
                notes: 'Sample grocery import',
                tags: ['imported'],
                cleared: true,
                goalId: null
            }
        ]);
    };
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-500", children: "Transactions" }), _jsx("h2", { className: "text-2xl font-semibold text-slate-900 dark:text-white", children: "Transactions workspace" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", onClick: handleImportSample, children: "Import sample" }), _jsx("button", { type: "button", className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", onClick: () => {
                                    setEditing(null);
                                    setDialogOpen(true);
                                }, children: "Add transaction" })] })] }), _jsx(FiltersBar, { accounts: accounts, categories: categories, value: filters, onChange: setFilters }), _jsx(TransactionsTable, { transactions: transactions, isLoading: transactionsQuery.isLoading, onEditRequest: (transaction) => {
                    setEditing(transaction);
                    setDialogOpen(true);
                }, onInlineUpdate: handleInlineUpdate, onDelete: handleDelete }), _jsx(Dialog.Root, { open: isDialogOpen, onOpenChange: setDialogOpen, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "fixed inset-0 bg-slate-900/60" }), _jsx(Dialog.Content, { className: "fixed inset-0 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx(Dialog.Title, { className: "text-lg font-semibold text-slate-900 dark:text-white", children: dialogTitle }), _jsx(Dialog.Close, { className: "rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800", children: "\u2715" })] }), accounts.length ? (_jsx(TransactionFormView, { accounts: accounts, categories: categories, defaultValues: defaultFormValues, onSubmit: handleFormSubmit, onCancel: () => setDialogOpen(false), submitLabel: editing ? 'Update' : 'Create' })) : (_jsx("p", { className: "text-sm text-slate-500", children: "Add an account first via the seed script to start logging transactions." }))] }) })] }) })] }));
}
function FiltersBar({ accounts, categories, value, onChange }) {
    return (_jsxs("div", { className: "grid gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:grid-cols-3", children: [_jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Account", _jsxs("select", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: value.accountId ?? '', onChange: (event) => onChange({
                            ...value,
                            accountId: event.target.value || null
                        }), children: [_jsx("option", { value: "", children: "All accounts" }), accounts.map((account) => (_jsx("option", { value: account.id, children: account.name }, account.id)))] })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Category", _jsxs("select", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: value.categoryId ?? '', onChange: (event) => onChange({
                            ...value,
                            categoryId: event.target.value || null
                        }), children: [_jsx("option", { value: "", children: "All categories" }), categories.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Search", _jsx("input", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", placeholder: "Notes or tags", value: value.search ?? '', onChange: (event) => onChange({
                            ...value,
                            search: event.target.value
                        }) })] })] }));
}
function transactionToForm(transaction) {
    return {
        id: transaction.id,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId ?? null,
        type: transaction.type,
        amountCents: transaction.amountCents,
        currency: transaction.currency,
        occurredOn: transaction.occurredOn,
        notes: transaction.notes ?? '',
        tags: transaction.tags ?? [],
        cleared: transaction.cleared,
        goalId: transaction.goalId ?? null
    };
}
