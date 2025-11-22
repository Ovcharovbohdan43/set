import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, type ReactNode } from 'react';

import { ToastProvider } from '@/components/ui/Toast';
import { useAppStore } from '@/store';

import { ThemeProvider } from './ThemeProvider';

interface Props {
  children: ReactNode;
}

/**
 * Consolidates context providers (React Query, theming, state, toast notifications).
 * Extend this module as additional cross-cutting concerns get implemented.
 */
export function AppProviders({ children }: Props) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <OfflineBridge />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
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

