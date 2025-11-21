import { Suspense } from 'react';

import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { TransactionsPage } from '@/features/transactions/components/TransactionsPage';
import { useAppStore } from '@/store';

export default function App() {
  const isOffline = useAppStore((state) => state.isOffline);

  return (
    <div className="min-h-screen bg-bg text-slate-900 dark:bg-bg-dark dark:text-slate-100">
      <header className="border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Personal Finance Desktop
            </p>
            <h1 className="text-2xl font-semibold text-primary">Finance OS</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isOffline ? (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
                Offline
              </span>
            ) : null}
            <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Transactions
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="p-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-300">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

