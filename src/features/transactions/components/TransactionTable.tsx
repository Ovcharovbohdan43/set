import { useMemo, useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';

import type { Transaction, TransactionForm } from '../schema';
import { formatCurrency } from '../utils/money';

type InlineField = 'notes' | 'amount';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEditRequest: (transaction: Transaction) => void;
  onInlineUpdate: (transaction: Transaction, patch: Partial<TransactionForm>) => void;
  onDelete: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  isLoading = false,
  onEditRequest,
  onInlineUpdate,
  onDelete
}: TransactionsTableProps) {
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: InlineField } | null>(null);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        header: 'Date',
        accessorKey: 'occurredOn',
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString()
      },
      {
        header: 'Account',
        accessorKey: 'accountName'
      },
      {
        header: 'Category',
        accessorKey: 'categoryName',
        cell: (info) => info.getValue<string>() ?? '—'
      },
      {
        header: 'Notes',
        accessorKey: 'notes',
        cell: (info) => {
          const transaction = info.row.original;
          const isEditing =
            inlineEdit?.id === transaction.id && inlineEdit.field === 'notes';
          if (!isEditing) {
            return (
              <button
                type="button"
                className="text-left text-slate-700 hover:text-primary dark:text-slate-200"
                onClick={() => setInlineEdit({ id: transaction.id, field: 'notes' })}
              >
                {transaction.notes ?? 'Add note'}
              </button>
            );
          }
          return (
            <input
              className="w-full rounded-md border border-primary px-2 py-1 text-sm"
              autoFocus
              defaultValue={transaction.notes ?? ''}
              onBlur={(event) => {
                onInlineUpdate(transaction, { notes: event.target.value });
                setInlineEdit(null);
              }}
            />
          );
        }
      },
      {
        header: 'Amount',
        accessorKey: 'amountCents',
        cell: (info) => {
          const transaction = info.row.original;
          const isEditing =
            inlineEdit?.id === transaction.id && inlineEdit.field === 'amount';
          if (!isEditing) {
            return (
              <button
                type="button"
                className={clsx(
                  'font-semibold',
                  transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                )}
                onClick={() => setInlineEdit({ id: transaction.id, field: 'amount' })}
              >
                {formatCurrency(transaction.amountCents, transaction.currency)}
              </button>
            );
          }
          return (
            <input
              className="w-24 rounded-md border border-primary px-2 py-1 text-right text-sm"
              type="number"
              step="0.01"
              defaultValue={(transaction.amountCents / 100).toFixed(2)}
              autoFocus
              onBlur={(event) => {
                const parsed = Number.parseFloat(event.target.value);
                if (!Number.isNaN(parsed)) {
                  onInlineUpdate(transaction, {
                    amountCents: Math.round(parsed * 100)
                  });
                }
                setInlineEdit(null);
              }}
            />
          );
        }
      },
      {
        header: '',
        id: 'actions',
        cell: (info) => {
          const transaction = info.row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={() => onEditRequest(transaction)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-900/30"
                onClick={() => onDelete(transaction.id)}
              >
                Delete
              </button>
            </div>
          );
        }
      }
    ],
    [inlineEdit, onDelete, onEditRequest, onInlineUpdate]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
        Loading transactions...
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-700/70">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

