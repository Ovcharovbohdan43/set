import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvents } from '@/utils/events';
import { fetchMonthlyReport, fetchMonthlyTrend, fetchSpendingByCategory, invalidateReportCache } from './api';
const monthlyReportKey = (month) => ['reports', 'monthly', month];
const spendingByCategoryKey = (startDate, endDate) => ['reports', 'spending-by-category', startDate, endDate];
const monthlyTrendKey = (months) => ['reports', 'trend', months];
export function useMonthlyReport(month) {
    return useQuery({
        queryKey: monthlyReportKey(month),
        queryFn: () => fetchMonthlyReport(month),
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}
export function useSpendingByCategory(startDate, endDate) {
    return useQuery({
        queryKey: spendingByCategoryKey(startDate, endDate),
        queryFn: () => fetchSpendingByCategory(startDate, endDate),
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}
export function useMonthlyTrend(months = 12) {
    return useQuery({
        queryKey: monthlyTrendKey(months),
        queryFn: () => fetchMonthlyTrend(months),
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}
export function useReportsInvalidation() {
    const queryClient = useQueryClient();
    useEffect(() => {
        const handler = () => {
            // Invalidate all report queries when transactions change
            void queryClient.invalidateQueries({ queryKey: ['reports'] });
            // Also invalidate cache on backend
            void invalidateReportCache();
        };
        window.addEventListener(AppEvents.transactionsChanged, handler);
        return () => window.removeEventListener(AppEvents.transactionsChanged, handler);
    }, [queryClient]);
}
