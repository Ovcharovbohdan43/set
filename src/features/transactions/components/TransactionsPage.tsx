import { useMemo, useState } from 'react';

import * as Dialog from '@radix-ui/react-dialog';

import { useAppStore } from '@/store';

import { TransactionFormView } from './TransactionForm';
import { TransactionsTable } from './TransactionTable';
import {
  useAccountsQuery,
  useCategoriesQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useImportTransactionsMutation,
  useTransactionsQuery,
  useUpdateTransactionMutation
} from '../hooks';
import type {
  Account,
  Category,
  Transaction,
  TransactionFilters,
  TransactionForm
} from '../schema';

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
  const [editing, setEditing] = useState<Transaction | null>(null);

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const transactions = transactionsQuery.data ?? [];

  const dialogTitle = editing ? 'Edit transaction' : 'Add transaction';

  const defaultFormValues = useMemo<TransactionForm | undefined>(() => {
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

  const handleFormSubmit = async (values: TransactionForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ ...values, id: editing.id });
      } else {
        await createMutation.mutateAsync(values);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInlineUpdate = (transaction: Transaction, patch: Partial<TransactionForm>) => {
    updateMutation.mutate({ ...transactionToForm(transaction), ...patch, id: transaction.id });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleImportSample = () => {
    const primaryAccount = accounts[0];
    if (!primaryAccount) return;
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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Transactions</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Transactions workspace
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={handleImportSample}
          >
            Import sample
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Add transaction
          </button>
        </div>
      </header>

      <FiltersBar
        accounts={accounts}
        categories={categories}
        value={filters}
        onChange={setFilters}
      />

      <TransactionsTable
        transactions={transactions}
        isLoading={transactionsQuery.isLoading}
        onEditRequest={(transaction) => {
          setEditing(transaction);
          setDialogOpen(true);
        }}
        onInlineUpdate={handleInlineUpdate}
        onDelete={handleDelete}
      />

      <Dialog.Root open={isDialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/60" />
          <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                  {dialogTitle}
                </Dialog.Title>
                <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  ✕
                </Dialog.Close>
              </div>
              {accounts.length ? (
                <TransactionFormView
                  accounts={accounts}
                  categories={categories}
                  defaultValues={defaultFormValues}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setDialogOpen(false)}
                  submitLabel={editing ? 'Update' : 'Create'}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Add an account first via the seed script to start logging transactions.
                </p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

interface FiltersBarProps {
  accounts: Account[];
  categories: Category[];
  value: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

function FiltersBar({ accounts, categories, value, onChange }: FiltersBarProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:grid-cols-3">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Account
        <select
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={value.accountId ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              accountId: event.target.value || null
            })
          }
        >
          <option value="">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Category
        <select
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={value.categoryId ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              categoryId: event.target.value || null
            })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Search
        <input
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          placeholder="Notes or tags"
          value={value.search ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              search: event.target.value
            })
          }
        />
      </label>
    </div>
  );
}

function transactionToForm(transaction: Transaction): TransactionForm {
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

