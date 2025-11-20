import { Suspense } from 'react';

import { TransactionsPage } from '@/features/transactions/components/TransactionsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-slate-900 dark:bg-bg-dark dark:text-slate-100">
      <header className="border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Personal Finance Desktop</p>
            <h1 className="text-2xl font-semibold text-primary">Transactions cockpit</h1>
          </div>
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Stage 2 · Accounts &amp; Transactions
          </span>
        </div>
      </header>
      <main className="p-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
              Loading transactions…
            </div>
          }
        >
          <TransactionsPage />
        </Suspense>
      </main>
    </div>
  );
}

