import { useEffect, useMemo, useState } from 'react';

import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';

import { useAppStore } from '@/store';
import { formatCurrency } from '@/features/transactions/utils/money';
import { TransactionFormView } from '@/features/transactions/components/TransactionForm';
import {
  useAccountsQuery,
  useCategoriesQuery,
  useCreateTransactionMutation
} from '@/features/transactions/hooks';
import type { TransactionForm } from '@/features/transactions/schema';

import { useDashboardInvalidation, useDashboardSnapshot } from '../hooks';
import type { DashboardSnapshot } from '../schema';
import { calculatePercent } from '../utils';

const EMPTY_SNAPSHOT: DashboardSnapshot = {
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
  const { mutateAsync: createTransaction, isPending: isCreating } =
    useCreateTransactionMutation(transactionFilters);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
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
  const cashDelta = formatCurrency(
    snapshot.cashFlowCents - snapshot.cashFlowPreviousCents,
    currency
  );
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
    label: 'Add goal',
    onSelect: () => {
      navigate('/goals');
      setPaletteOpen(false);
    },
    shortcut: 'Ctrl + Shift + G'
  }
];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Financial cockpit
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Net worth, cash flow, budgets, and weekly spend in one glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isOffline ? (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300">
              Offline mode
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            onClick={() => setPaletteOpen(true)}
          >
            Command palette (Ctrl + K)
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Net worth"
          value={netWorth}
          delta={netDelta}
          isLoading={isLoading && !data}
          trend={snapshot.netWorthDeltaCents}
        />
        <KpiCard
          title="30d cash flow"
          value={cashFlow}
          delta={cashDelta}
          isLoading={isLoading && !data}
          trend={snapshot.cashFlowCents - snapshot.cashFlowPreviousCents}
        />
        <BudgetCard
          total={snapshot.budgetTotalCents}
          spent={snapshot.budgetSpentCents}
          percent={budgetPercent}
          currency={currency}
          isLoading={isLoading && !data}
        />
      </div>

      <QuickActions
        onAddTransaction={() => setQuickAddOpen(true)}
        onAddGoal={() => navigate('/goals')}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <WeeklySpendingCard
          data={snapshot.weeklySpending}
          currency={currency}
          isLoading={isLoading && !data}
        />
        <AccountsPanel accounts={snapshot.accounts} currency={currency} isLoading={isLoading && !data} />
      </div>

      <CommandPaletteDialog
        open={isPaletteOpen}
        onOpenChange={setPaletteOpen}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
        actions={filteredActions}
      />

      <ShortcutsDialog open={isShortcutsOpen} onOpenChange={setShortcutsOpen} />

      <QuickTransactionDialog
        open={isQuickAddOpen}
        onOpenChange={setQuickAddOpen}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        isSubmitting={isCreating}
        onSubmit={async (values: TransactionForm) => {
          try {
            await createTransaction(values);
            setQuickAddOpen(false);
          } catch (error: unknown) {
            let message = 'Unknown error';
            if (error instanceof Error) {
              message = error.message;
            } else if (typeof error === 'string') {
              message = error;
            } else {
              try {
                message = JSON.stringify(error);
              } catch {
                message = String(error);
              }
            }
            console.error('Failed to create transaction', message);
          }
        }}
      />
    </section>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  delta: string;
  trend: number;
  isLoading?: boolean;
}

function KpiCard({ title, value, delta, trend, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const trendClass =
    trend === 0
      ? 'text-slate-500'
      : trend > 0
      ? 'text-emerald-600 dark:text-emerald-300'
      : 'text-rose-600 dark:text-rose-300';

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className={`mt-1 text-sm font-medium ${trendClass}`}>
        {trend > 0 ? '▲' : trend < 0 ? '▼' : '●'} {delta}
      </p>
    </div>
  );
}

interface BudgetCardProps {
  total: number;
  spent: number;
  percent: number;
  currency: string;
  isLoading?: boolean;
}

function BudgetCard({ total, spent, percent, currency, isLoading }: BudgetCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget burn</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        {formatCurrency(spent, currency)} / {formatCurrency(total, currency)}
      </p>
      <div className="mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-3 rounded-full ${percent >= 90 ? 'bg-rose-500' : 'bg-primary'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {percent}% of tracked envelopes have been used this period.
      </p>
    </div>
  );
}

interface QuickActionsProps {
  onAddTransaction: () => void;
  onAddGoal: () => void;
}

function QuickActions({ onAddGoal, onAddTransaction }: QuickActionsProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:grid-cols-2">
      <button
        type="button"
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-800 transition hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        onClick={onAddTransaction}
      >
        <span>
          <strong className="block text-base">Add transaction</strong>
          <span className="text-sm text-slate-500">Ctrl + N</span>
        </span>
        <span className="text-2xl">＋</span>
      </button>
      <button
        type="button"
        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-slate-800 transition hover:border-primary/40 dark:border-slate-700 dark:text-slate-100"
        onClick={onAddGoal}
      >
        <span>
          <strong className="block text-base">Add goal</strong>
          <span className="text-sm text-slate-500">Ctrl + Shift + G</span>
        </span>
        <span className="text-2xl">🎯</span>
      </button>
    </div>
  );
}

interface WeeklySpendingCardProps {
  data: DashboardSnapshot['weeklySpending'];
  currency: string;
  isLoading?: boolean;
}

function WeeklySpendingCard({ data, currency, isLoading }: WeeklySpendingCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-40 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const max = Math.max(...data.map((point) => point.amountCents), 1);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Weekly spend
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatCurrency(
              data.reduce((sum, point) => sum + point.amountCents, 0),
              currency
            )}
          </p>
        </div>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3">
        {data.map((point, index) => {
          const ratio = point.amountCents / max;
          const date = point.date ? new Date(point.date) : null;
          const label = date
            ? date.toLocaleDateString(undefined, { weekday: 'short' })
            : '—';
          return (
            <div key={`${point.date}-${index}`} className="flex flex-1 flex-col">
              <div
                className="rounded-full bg-primary/30 dark:bg-primary/60"
                style={{ height: `${Math.max(ratio * 100, 4)}%` }}
                title={formatCurrency(point.amountCents, currency)}
              />
              <span className="mt-2 text-center text-xs uppercase text-slate-500">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AccountsPanelProps {
  accounts: DashboardSnapshot['accounts'];
  currency: string;
  isLoading?: boolean;
}

function AccountsPanel({ accounts, currency, isLoading }: AccountsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top accounts</p>
      <ul className="mt-4 space-y-3">
        {accounts.length ? (
          accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {account.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {account.accountType ?? '—'}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatCurrency(account.balanceCents, currency)}
              </p>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500 dark:text-slate-400">
            Seed at least one account to view highlights.
          </li>
        )}
      </ul>
    </div>
  );
}

interface QuickTransactionDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  accounts: ReturnType<typeof useAccountsQuery>['data'];
  categories: ReturnType<typeof useCategoriesQuery>['data'];
  isSubmitting: boolean;
  onSubmit: (values: TransactionForm) => Promise<void>;
}

function QuickTransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  isSubmitting,
  onSubmit
}: QuickTransactionDialogProps) {
  const defaultValues = useMemo<TransactionForm | undefined>(() => {
    const [firstAccount] = accounts ?? [];
    if (!firstAccount) return undefined;
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                Quick add transaction
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                ✕
              </Dialog.Close>
            </div>
            {accounts?.length ? (
              <TransactionFormView
                accounts={accounts}
                categories={categories ?? []}
                defaultValues={defaultValues}
                submitLabel={isSubmitting ? 'Saving…' : 'Create'}
                onCancel={() => onOpenChange(false)}
                onSubmit={(values) => {
                  onSubmit(values).catch((error: unknown) => {
                    const message =
                      error instanceof Error ? error.message : String(error);
                    console.error('Failed to submit quick transaction form', message);
                  });
                }}
              />
            ) : (
              <p className="text-sm text-slate-500">
                Seed an account first (run `pnpm tsx scripts/seed.ts`) to enable quick add.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface CommandPaletteDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  actions: {
    id: string;
    label: string;
    shortcut?: string;
    onSelect: () => void;
  }[];
  query: string;
  onQueryChange: (value: string) => void;
}

function CommandPaletteDialog({
  open,
  onOpenChange,
  actions,
  query,
  onQueryChange
}: CommandPaletteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 flex items-start justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Type a command or search..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
            />
            <ul className="mt-4 max-h-64 overflow-y-auto">
              {actions.length ? (
                actions.map((action) => (
                  <li key={action.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={action.onSelect}
                    >
                      {action.label}
                      {action.shortcut ? (
                        <span className="text-xs text-slate-400">{action.shortcut}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-slate-500">No matching commands</li>
              )}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const shortcuts = [
    { combo: 'Ctrl + N', description: 'Add transaction' },
    { combo: 'Ctrl + K', description: 'Open command palette' },
    { combo: 'Ctrl + Shift + B', description: 'Budget shortcut (Stage 4)' },
    { combo: 'Ctrl + /', description: 'Show shortcuts' }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                Keyboard shortcuts
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                ✕
              </Dialog.Close>
            </div>
            <ul className="space-y-3">
              {shortcuts.map((shortcut) => (
                <li
                  key={shortcut.combo}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {shortcut.combo}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{shortcut.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

