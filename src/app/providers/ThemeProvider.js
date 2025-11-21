import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useUserSettingsQuery } from '@/features/settings/hooks';
/**
 * ThemeProvider initializes and manages theme preference from user settings.
 * Applies theme to document root on mount and when settings change.
 * Uses a ref to track the last applied theme to avoid unnecessary re-applications.
 */
export function ThemeProvider({ children }) {
    const { data: settings, isLoading } = useUserSettingsQuery();
    const lastAppliedThemeRef = useRef(null);
    const mediaQueryRef = useRef(null);
    const handlerRef = useRef(null);
    useEffect(() => {
        // Don't apply theme if settings are still loading
        if (isLoading) {
            return;
        }
        const root = document.documentElement;
        const themePreference = settings?.themePreference ?? 'auto';
        const applyTheme = (theme) => {
            const effectiveTheme = theme === 'auto'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                : theme;
            // Only apply if theme actually changed
            if (lastAppliedThemeRef.current !== effectiveTheme) {
                root.setAttribute('data-theme', effectiveTheme);
                lastAppliedThemeRef.current = effectiveTheme;
            }
        };
        // Clean up previous media query listener if it exists
        if (mediaQueryRef.current && handlerRef.current) {
            mediaQueryRef.current.removeEventListener('change', handlerRef.current);
            mediaQueryRef.current = null;
            handlerRef.current = null;
        }
        // Apply initial theme
        applyTheme(themePreference);
        // Listen for system theme changes when using 'auto'
        if (themePreference === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e) => {
                const effectiveTheme = e.matches ? 'dark' : 'light';
                if (lastAppliedThemeRef.current !== effectiveTheme) {
                    root.setAttribute('data-theme', effectiveTheme);
                    lastAppliedThemeRef.current = effectiveTheme;
                }
            };
            mediaQuery.addEventListener('change', handler);
            mediaQueryRef.current = mediaQuery;
            handlerRef.current = handler;
        }
        return () => {
            if (mediaQueryRef.current && handlerRef.current) {
                mediaQueryRef.current.removeEventListener('change', handlerRef.current);
                mediaQueryRef.current = null;
                handlerRef.current = null;
            }
        };
    }, [settings?.themePreference, isLoading]);
    return _jsx(_Fragment, { children: children });
}
