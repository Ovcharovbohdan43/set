import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Consolidates context providers (React Query, theming, state).
 * Extend this module as additional cross-cutting concerns get implemented.
 */
export function AppProviders({ children }: Props) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

