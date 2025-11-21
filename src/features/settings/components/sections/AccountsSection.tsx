import { useMemo, useState } from 'react';

import { useUserSettingsQuery } from '../../hooks';
import { useAppStore } from '@/store';

interface AccountPreference {
  id: string;
  name: string;
  currency: string;
  type: string;
}

const DEMO_ACCOUNTS: AccountPreference[] = [
  { id: 'acct-checking', name: 'Main Checking', currency: 'USD', type: 'checking' },
  { id: 'acct-savings', name: 'Emergency Savings', currency: 'USD', type: 'savings' }
];

export function AccountsSection() {
  const { data: settings } = useUserSettingsQuery();
  const isOffline = useAppStore((state) => state.isOffline);
  const [defaultAccountId, setDefaultAccountId] = useState<string>('acct-checking');

  const accounts = useMemo(() => DEMO_ACCOUNTS, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Accounts</p>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Account Preferences</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose your default account for quick actions and sync, and review linked currencies.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Default account</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Used for quick-add transactions and reminders. Honors your locale/currency (
          {settings?.defaultCurrency ?? 'USD'}).
        </p>
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          value={defaultAccountId}
          onChange={(e) => setDefaultAccountId(e.target.value)}
        >
          {accounts.map((acct) => (
            <option key={acct.id} value={acct.id}>
              {acct.name} · {acct.currency.toUpperCase()} ({acct.type})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {isOffline
            ? 'Offline: changes will apply locally and sync when online.'
            : 'Online: default account is ready for sync.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Linked currencies</h4>
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {accounts.map((acct) => (
            <li key={acct.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <span>{acct.name}</span>
              <span className="font-mono text-xs">{acct.currency.toUpperCase()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
