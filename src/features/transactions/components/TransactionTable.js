import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { formatCurrency } from '../utils/money';
export function TransactionsTable({ transactions, isLoading = false, onEditRequest, onInlineUpdate, onDelete }) {
    const [inlineEdit, setInlineEdit] = useState(null);
    const columns = useMemo(() => [
        {
            header: 'Date',
            accessorKey: 'occurredOn',
            cell: (info) => new Date(info.getValue()).toLocaleDateString()
        },
        {
            header: 'Account',
            accessorKey: 'accountName'
        },
        {
            header: 'Category',
            accessorKey: 'categoryName',
            cell: (info) => info.getValue() ?? '—'
        },
        {
            header: 'Notes',
            accessorKey: 'notes',
            cell: (info) => {
                const transaction = info.row.original;
                const isEditing = inlineEdit?.id === transaction.id && inlineEdit.field === 'notes';
                if (!isEditing) {
                    return (_jsx("button", { type: "button", className: "text-left text-slate-700 hover:text-primary dark:text-slate-200", onClick: () => setInlineEdit({ id: transaction.id, field: 'notes' }), children: transaction.notes ?? 'Add note' }));
                }
                return (_jsx("input", { className: "w-full rounded-md border border-primary px-2 py-1 text-sm", autoFocus: true, defaultValue: transaction.notes ?? '', onBlur: (event) => {
                        onInlineUpdate(transaction, { notes: event.target.value });
                        setInlineEdit(null);
                    } }));
            }
        },
        {
            header: 'Amount',
            accessorKey: 'amountCents',
            cell: (info) => {
                const transaction = info.row.original;
                const isEditing = inlineEdit?.id === transaction.id && inlineEdit.field === 'amount';
                if (!isEditing) {
                    return (_jsx("button", { type: "button", className: clsx('font-semibold', transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'), onClick: () => setInlineEdit({ id: transaction.id, field: 'amount' }), children: formatCurrency(transaction.amountCents, transaction.currency) }));
                }
                return (_jsx("input", { className: "w-24 rounded-md border border-primary px-2 py-1 text-right text-sm", type: "number", step: "0.01", defaultValue: (transaction.amountCents / 100).toFixed(2), autoFocus: true, onBlur: (event) => {
                        const parsed = Number.parseFloat(event.target.value);
                        if (!Number.isNaN(parsed)) {
                            onInlineUpdate(transaction, {
                                amountCents: Math.round(parsed * 100)
                            });
                        }
                        setInlineEdit(null);
                    } }));
            }
        },
        {
            header: '',
            id: 'actions',
            cell: (info) => {
                const transaction = info.row.original;
                return (_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800", onClick: () => onEditRequest(transaction), children: "Edit" }), _jsx("button", { type: "button", className: "rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-900/30", onClick: () => onDelete(transaction.id), children: "Delete" })] }));
            }
        }
    ], [inlineEdit, onDelete, onEditRequest, onInlineUpdate]);
    const table = useReactTable({
        data: transactions,
        columns,
        getCoreRowModel: getCoreRowModel()
    });
    if (isLoading) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300", children: "Loading transactions..." }));
    }
    if (!transactions.length) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300", children: "No transactions yet." }));
    }
    return (_jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-700/70", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/40", children: table.getHeaderGroups().map((headerGroup) => (_jsx("tr", { children: headerGroup.headers.map((header) => (_jsx("th", { className: "px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, headerGroup.id))) }), _jsx("tbody", { className: "divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900", children: table.getRowModel().rows.map((row) => (_jsx("tr", { className: "hover:bg-slate-50/70 dark:hover:bg-slate-800/60", children: row.getVisibleCells().map((cell) => (_jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) }));
}
