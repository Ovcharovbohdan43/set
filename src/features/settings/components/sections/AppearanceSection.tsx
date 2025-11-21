import { useEffect, useState } from 'react';

import { useUpdateUserSettingsMutation, useUserSettingsQuery } from '../../hooks';

const THEMES = [
  { value: 'auto', label: 'Auto (System)' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

export function AppearanceSection() {
  const { data: settings, isLoading } = useUserSettingsQuery();
  const updateMutation = useUpdateUserSettingsMutation();

  const [localTheme, setLocalTheme] = useState<string>('auto');

  // Sync local theme with settings, but don't apply theme here
  // Theme is applied by ThemeProvider at app level
  useEffect(() => {
    if (settings?.themePreference) {
      setLocalTheme(settings.themePreference);
    } else {
      setLocalTheme('auto');
    }
  }, [settings]);

  const handleThemeChange = async (theme: string) => {
    // Optimistically update local state
    setLocalTheme(theme);
    
    // Apply theme immediately for better UX
    const root = document.documentElement;
    const effectiveTheme =
      theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    root.setAttribute('data-theme', effectiveTheme);

    try {
      await updateMutation.mutateAsync({ themePreference: theme });
    } catch (error) {
      console.error('Failed to update theme', error);
      // Revert on error
      const previousTheme = settings?.themePreference ?? 'auto';
      setLocalTheme(previousTheme);
      const previousEffectiveTheme =
        previousTheme === 'auto'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : previousTheme;
      root.setAttribute('data-theme', previousEffectiveTheme);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading appearance settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose your preferred theme and color scheme
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Theme
          </label>
          <select
            id="theme"
            value={localTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {THEMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {localTheme === 'auto'
              ? 'Theme will follow your system preference'
              : `Theme is set to ${localTheme}`}
          </p>
        </div>
      </div>
    </div>
  );
}

