import { useMemo } from 'react';

import { useSyncStatus } from '@/features/sync/hooks';
import { useAppStore } from '@/store';

export function SyncSection() {
  const isOffline = useAppStore((state) => state.isOffline);
  const syncWindow = window as (Window & { __PF_SYNC_JWT?: string }) | undefined;
  const syncJwt = syncWindow?.__PF_SYNC_JWT ?? import.meta.env.VITE_SYNC_JWT ?? undefined;
  const { isSyncing, lastCursor, envelope, message, error, triggerSync, triggerDownload } =
    useSyncStatus(syncJwt);

  const health = useMemo(() => {
    if (isOffline) return { badge: 'bg-yellow-100 text-yellow-700', label: 'Offline' };
    if (isSyncing) return { badge: 'bg-blue-100 text-blue-700', label: 'Syncing' };
    return { badge: 'bg-emerald-100 text-emerald-700', label: 'Ready' };
  }, [isOffline, isSyncing]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Sync</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Cloud Sync &amp; Packaging Readiness
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manual sync trigger, status visibility, and conflict-free envelopes.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${health.badge}`}
        >
          {health.label}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Manual Sync</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Send local deltas to the Fastify gateway with JWT/HMAC-encrypted envelopes.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => triggerSync()}
              disabled={isSyncing || isOffline}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              onClick={() => triggerDownload()}
              disabled={isSyncing}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Download
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Status</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
          <dl className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <dt>Last cursor</dt>
              <dd className="font-mono text-[11px]">{lastCursor ?? 'n/a'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>JWT used</dt>
              <dd className="font-semibold">{envelope?.jwtUsed ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Deltas</dt>
              <dd className="font-semibold">{envelope?.deltas.length ?? 0}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Integrity</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payloads are base64-wrapped and HMAC-signed. Verify signatures in CI or via the Fastify
            sync gateway before applying.
          </p>
          <code className="mt-2 block overflow-hidden text-ellipsis rounded-lg bg-slate-900/80 p-2 text-[11px] text-emerald-200">
            {envelope?.signature ?? 'signature-pending'}
          </code>
        </div>
      </div>
    </div>
  );
}
