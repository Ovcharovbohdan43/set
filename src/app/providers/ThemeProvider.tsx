import { useEffect, useRef, type ReactNode } from 'react';

import { useUserSettingsQuery } from '@/features/settings/hooks';

interface Props {
  children: ReactNode;
}

/**
 * ThemeProvider initializes and manages theme preference from user settings.
 * Applies theme to document root on mount and when settings change.
 * Uses a ref to track the last applied theme to avoid unnecessary re-applications.
 */
export function ThemeProvider({ children }: Props) {
  const { data: settings, isLoading } = useUserSettingsQuery();
  const lastAppliedThemeRef = useRef<string | null>(null);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const handlerRef = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  useEffect(() => {
    // Don't apply theme if settings are still loading
    if (isLoading) {
      return;
    }

    const root = document.documentElement;
    const themePreference = settings?.themePreference ?? 'auto';

    const applyTheme = (theme: string) => {
      const effectiveTheme =
        theme === 'auto'
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
      const handler = (e: MediaQueryListEvent) => {
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

  return <>{children}</>;
}

