import { useEffect, useState } from 'react';

import { useUpdateUserSettingsMutation, useUserSettingsQuery } from '../../hooks';

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'RUB', label: 'Russian Ruble (RUB)' }
];

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ru-RU', label: 'Русский' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' }
];

const WEEK_STARTS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' }
];

export function GeneralSection() {
  const { data: settings, isLoading, isError, error } = useUserSettingsQuery();
  const updateMutation = useUpdateUserSettingsMutation();

  const [localCurrency, setLocalCurrency] = useState(settings?.defaultCurrency ?? 'USD');
  const [localLocale, setLocalLocale] = useState(settings?.locale ?? 'en-US');
  const [localWeekStartsOn, setLocalWeekStartsOn] = useState(settings?.weekStartsOn ?? 1);
  const [localDisplayName, setLocalDisplayName] = useState(settings?.displayName ?? '');
  const [localTelemetryOptIn, setLocalTelemetryOptIn] = useState(settings?.telemetryOptIn ?? false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-500">Loading settings...</div>
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>
    );
  }

  if (isError) {
    console.error('Failed to load settings:', error);
    return (
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="text-sm font-medium text-red-800 dark:text-red-400">
          Failed to load settings
        </div>
        {error instanceof Error && (
          <div className="text-xs text-red-600 dark:text-red-500">{error.message}</div>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Settings not available. Please try refreshing the page.
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Update local state when settings change
  useEffect(() => {
    setLocalCurrency(settings.defaultCurrency);
    setLocalLocale(settings.locale);
    setLocalWeekStartsOn(settings.weekStartsOn);
    setLocalDisplayName(settings.displayName ?? '');
    setLocalTelemetryOptIn(settings.telemetryOptIn);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        defaultCurrency: localCurrency !== settings.defaultCurrency ? localCurrency : undefined,
        locale: localLocale !== settings.locale ? localLocale : undefined,
        weekStartsOn: localWeekStartsOn !== settings.weekStartsOn ? localWeekStartsOn : undefined,
        displayName: localDisplayName !== (settings.displayName ?? '') ? localDisplayName : undefined,
        telemetryOptIn: localTelemetryOptIn !== settings.telemetryOptIn ? localTelemetryOptIn : undefined
      });
    } catch (error) {
      console.error('Failed to update settings', error);
    }
  };

  const hasChanges =
    localCurrency !== settings.defaultCurrency ||
    localLocale !== settings.locale ||
    localWeekStartsOn !== settings.weekStartsOn ||
    localDisplayName !== (settings.displayName ?? '') ||
    localTelemetryOptIn !== settings.telemetryOptIn;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">General Settings</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure your default currency, locale, and week start day
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={localDisplayName}
            onChange={(e) => setLocalDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Default Currency
          </label>
          <select
            id="currency"
            value={localCurrency}
            onChange={(e) => setLocalCurrency(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="locale" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Locale
          </label>
          <select
            id="locale"
            value={localLocale}
            onChange={(e) => setLocalLocale(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {LOCALES.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="week-starts" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Week Starts On
          </label>
          <select
            id="week-starts"
            value={localWeekStartsOn}
            onChange={(e) => setLocalWeekStartsOn(Number.parseInt(e.target.value, 10))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {WEEK_STARTS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="telemetry" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Telemetry
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Help improve the app by sharing anonymous usage data
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                id="telemetry"
                type="checkbox"
                checked={localTelemetryOptIn}
                onChange={(e) => setLocalTelemetryOptIn(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:bg-slate-600 dark:after:border-slate-600"></div>
            </label>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setLocalCurrency(settings.defaultCurrency);
              setLocalLocale(settings.locale);
              setLocalWeekStartsOn(settings.weekStartsOn);
              setLocalDisplayName(settings.displayName ?? '');
              setLocalTelemetryOptIn(settings.telemetryOptIn);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

