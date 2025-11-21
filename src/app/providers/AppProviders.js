import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store';
import { ThemeProvider } from './ThemeProvider';
/**
 * Consolidates context providers (React Query, theming, state).
 * Extend this module as additional cross-cutting concerns get implemented.
 */
export function AppProviders({ children }) {
    const queryClient = useMemo(() => new QueryClient(), []);
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(ThemeProvider, { children: [_jsx(OfflineBridge, {}), children] }) }));
}
function OfflineBridge() {
    const setOffline = useAppStore((state) => state.setOffline);
    useEffect(() => {
        const update = () => setOffline(!navigator.onLine);
        update();
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, [setOffline]);
    return null;
}
