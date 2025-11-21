import { useState } from 'react';

export function NotificationsSection() {
  const [enableToasts, setEnableToasts] = useState(true);
  const [enableInApp, setEnableInApp] = useState(true);
  const [enableEmail, setEnableEmail] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Control how reminders and alerts are delivered across toast, in-app, and email channels.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Windows toast</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uses the native notification channel for due reminders.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enableToasts}
            onChange={(e) => setEnableToasts(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">In-app center</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keeps a history of notifications in the Notification Center panel.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enableInApp}
            onChange={(e) => setEnableInApp(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Email (coming with sync)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Queue summary emails when sync backend is enabled.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enableEmail}
            onChange={(e) => setEnableEmail(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>
    </div>
  );
}
