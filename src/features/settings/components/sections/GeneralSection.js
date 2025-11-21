import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useUpdateUserSettingsMutation, useUserSettingsQuery } from '../../hooks';
const CURRENCIES = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' }
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
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-sm text-slate-500", children: "Loading settings..." }), _jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" })] }));
    }
    if (isError) {
        console.error('Failed to load settings:', error);
        return (_jsxs("div", { className: "space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20", children: [_jsx("div", { className: "text-sm font-medium text-red-800 dark:text-red-400", children: "Failed to load settings" }), error instanceof Error && (_jsx("div", { className: "text-xs text-red-600 dark:text-red-500", children: error.message })), _jsx("button", { type: "button", onClick: () => window.location.reload(), className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600", children: "Retry" })] }));
    }
    if (!settings) {
        return (_jsxs("div", { className: "space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("div", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Settings not available. Please try refreshing the page." }), _jsx("button", { type: "button", onClick: () => window.location.reload(), className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90", children: "Refresh" })] }));
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
        }
        catch (error) {
            console.error('Failed to update settings', error);
        }
    };
    const hasChanges = localCurrency !== settings.defaultCurrency ||
        localLocale !== settings.locale ||
        localWeekStartsOn !== settings.weekStartsOn ||
        localDisplayName !== (settings.displayName ?? '') ||
        localTelemetryOptIn !== settings.telemetryOptIn;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "General Settings" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Configure your default currency, locale, and week start day" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "display-name", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Display Name" }), _jsx("input", { id: "display-name", type: "text", value: localDisplayName, onChange: (e) => setLocalDisplayName(e.target.value), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white", placeholder: "Your name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "currency", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Default Currency" }), _jsx("select", { id: "currency", value: localCurrency, onChange: (e) => setLocalCurrency(e.target.value), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white", children: CURRENCIES.map((curr) => (_jsx("option", { value: curr.value, children: curr.label }, curr.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "locale", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Locale" }), _jsx("select", { id: "locale", value: localLocale, onChange: (e) => setLocalLocale(e.target.value), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white", children: LOCALES.map((loc) => (_jsx("option", { value: loc.value, children: loc.label }, loc.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "week-starts", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Week Starts On" }), _jsx("select", { id: "week-starts", value: localWeekStartsOn, onChange: (e) => setLocalWeekStartsOn(Number.parseInt(e.target.value, 10)), className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white", children: WEEK_STARTS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsx("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "telemetry", className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Telemetry" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Help improve the app by sharing anonymous usage data" })] }), _jsxs("label", { className: "relative inline-flex cursor-pointer items-center", children: [_jsx("input", { id: "telemetry", type: "checkbox", checked: localTelemetryOptIn, onChange: (e) => setLocalTelemetryOptIn(e.target.checked), className: "peer sr-only" }), _jsx("div", { className: "peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:bg-slate-600 dark:after:border-slate-600" })] })] }) })] }), hasChanges && (_jsxs("div", { className: "flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsx("button", { type: "button", onClick: () => {
                            setLocalCurrency(settings.defaultCurrency);
                            setLocalLocale(settings.locale);
                            setLocalWeekStartsOn(settings.weekStartsOn);
                            setLocalDisplayName(settings.displayName ?? '');
                            setLocalTelemetryOptIn(settings.telemetryOptIn);
                        }, className: "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700", children: "Cancel" }), _jsx("button", { type: "button", onClick: handleSave, disabled: updateMutation.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50", children: updateMutation.isPending ? 'Saving...' : 'Save Changes' })] }))] }));
}
