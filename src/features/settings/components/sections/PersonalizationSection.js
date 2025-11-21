import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useUpdateUserSettingsMutation, useUserSettingsQuery } from '../../hooks';
const THEMES = [
    { value: 'auto', label: 'Auto (System)' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
];
export function PersonalizationSection() {
    const { data: settings, isLoading } = useUserSettingsQuery();
    const updateMutation = useUpdateUserSettingsMutation();
    const [localTheme, setLocalTheme] = useState('auto');
    // Sync local theme with settings
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
        return _jsx("div", { className: "text-sm text-slate-500", children: "Loading personalization settings..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Personalization" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Customize the appearance and behavior of the application" })] }), _jsx("div", { className: "space-y-6", children: _jsx("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "theme-select", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Theme" }), _jsx("select", { id: "theme-select", value: localTheme, onChange: (e) => handleThemeChange(e.target.value), className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:border-slate-500", children: THEMES.map((theme) => (_jsx("option", { value: theme.value, children: theme.label }, theme.value))) }), _jsx("p", { className: "mt-2 text-xs text-slate-500 dark:text-slate-400", children: localTheme === 'auto'
                                            ? 'Theme will follow your system preference'
                                            : `Theme is set to ${localTheme}` })] }), _jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Current Theme" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: (() => {
                                                    const effectiveTheme = localTheme === 'auto'
                                                        ? window.matchMedia('(prefers-color-scheme: dark)').matches
                                                            ? 'dark'
                                                            : 'light'
                                                        : localTheme;
                                                    return effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode';
                                                })() })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => handleThemeChange('light'), className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${(localTheme === 'auto'
                                                    ? !window.matchMedia('(prefers-color-scheme: dark)').matches
                                                    : localTheme === 'light')
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500'}`, children: "Light" }), _jsx("button", { type: "button", onClick: () => handleThemeChange('dark'), className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${(localTheme === 'auto'
                                                    ? window.matchMedia('(prefers-color-scheme: dark)').matches
                                                    : localTheme === 'dark')
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500'}`, children: "Dark" })] })] })] }) }) })] }));
}
