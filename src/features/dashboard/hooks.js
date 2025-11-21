import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvents } from '@/utils/events';
import { fetchDashboardSnapshot } from './api';
const dashboardKey = ['dashboard', 'snapshot'];
export function useDashboardSnapshot() {
    const query = useQuery({
        queryKey: dashboardKey,
        queryFn: fetchDashboardSnapshot,
        staleTime: 1000 * 30
    });
    return query;
}
export function useDashboardInvalidation() {
    const queryClient = useQueryClient();
    useEffect(() => {
        const handler = () => {
            void queryClient.invalidateQueries({ queryKey: dashboardKey });
        };
        window.addEventListener(AppEvents.transactionsChanged, handler);
        return () => window.removeEventListener(AppEvents.transactionsChanged, handler);
    }, [queryClient]);
}
