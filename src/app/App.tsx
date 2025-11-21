import { Suspense, useEffect, useState } from 'react';

import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

import { BudgetsPage } from '@/features/budgets/components/BudgetsPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { GoalsPage } from '@/features/goals/components/GoalsPage';
import { NotificationCenter } from '@/features/reminders/components/NotificationCenter';
import { RemindersPage } from '@/features/reminders/components/RemindersPage';
import type { Reminder } from '@/features/reminders/schema';
import { ReportsPage } from '@/features/reports/components/ReportsPage';
import { SettingsPage } from '@/features/settings/components/SettingsPage';
import { TransactionsPage } from '@/features/transactions/components/TransactionsPage';
import { useAppStore } from '@/store';

export default function App() {
  const isOffline = useAppStore((state) => state.isOffline);
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && key === 'n' && event.shiftKey) {
        event.preventDefault();
        setNotificationCenterOpen(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Listen for notification:prepared events from scheduler
  useEffect(() => {
    // Request notification permission on mount
    void (async () => {
      if (!(await isPermissionGranted())) {
        await requestPermission();
      }
    })();

    // Listen for reminder notifications from scheduler
    const unlisten = listen<Reminder>('notification:prepared', async (event) => {
      const reminder = event.payload;
      
      // Only show toast notifications for toast channel
      if (reminder.channel === 'toast') {
        const hasPermission = await isPermissionGranted();
        if (!hasPermission) {
          const permission = await requestPermission();
          if (permission !== 'granted') {
            return;
          }
        }

        // Format notification body
        let body = reminder.description ?? '';
        if (reminder.amountCents !== null && reminder.amountCents !== undefined) {
          const amount = (reminder.amountCents / 100).toFixed(2);
          body = body ? `${body} - Amount: $${amount}` : `Amount: $${amount}`;
        }
        if (reminder.accountName) {
          body = body ? `${body} (${reminder.accountName})` : `Account: ${reminder.accountName}`;
        }

        // Show Windows toast notification
        // Note: Windows toast actions (Pay/Snooze/Open) require additional integration
        // with Windows Toast API via winrt crate. This is planned for future enhancement.
        sendNotification({
          title: reminder.title,
          body: body || 'Reminder due',
          // Windows toast actions require native Windows Toast API integration
          // For now, clicking notification opens the app
        });

        // Open notification center to show in-app notification
        setNotificationCenterOpen(true);
      }
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

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
            <button
              onClick={() => setNotificationCenterOpen(true)}
              className="relative rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              title="Notifications (Ctrl+Shift+N)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
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
              <NavLink
                to="/budgets"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Budgets
              </NavLink>
              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Goals
              </NavLink>
              <NavLink
                to="/reminders"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Reminders
              </NavLink>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Reports
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Settings
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
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
      <NotificationCenter
        open={isNotificationCenterOpen}
        onOpenChange={setNotificationCenterOpen}
      />
    </div>
  );
}

