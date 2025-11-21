import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [localTheme, setLocalTheme] = useState('auto');
    // Sync local theme with settings, but don't apply theme here
    // Theme is applied by ThemeProvider at app level
    useEffect(() => {
        if (settings?.themePreference) {
            setLocalTheme(settings.themePreference);
        }
        else {
            setLocalTheme('auto');
        }
    }, [settings]);
    const handleThemeChange = async (theme) => {
        // Optimistically update local state
        setLocalTheme(theme);
        // Apply theme immediately for better UX
        const root = document.documentElement;
        const effectiveTheme = theme === 'auto'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            : theme;
        root.setAttribute('data-theme', effectiveTheme);
        try {
            await updateMutation.mutateAsync({ themePreference: theme });
        }
        catch (error) {
            console.error('Failed to update theme', error);
            // Revert on error
            const previousTheme = settings?.themePreference ?? 'auto';
            setLocalTheme(previousTheme);
            const previousEffectiveTheme = previousTheme === 'auto'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                : previousTheme;
            root.setAttribute('data-theme', previousEffectiveTheme);
        }
    };
    if (isLoading) {
        return _jsx("div", { className: "text-sm text-slate-500", children: "Loading appearance settings..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Appearance" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Choose your preferred theme and color scheme" })] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { htmlFor: "theme", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Theme" }), _jsx("select", { id: "theme", value: localTheme, onChange: (e) => handleThemeChange(e.target.value), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white", children: THEMES.map((theme) => (_jsx("option", { value: theme.value, children: theme.label }, theme.value))) }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: localTheme === 'auto'
                                ? 'Theme will follow your system preference'
                                : `Theme is set to ${localTheme}` })] }) })] }));
}
