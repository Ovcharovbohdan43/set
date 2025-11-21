import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppEvents } from '@/utils/events';

import {
  fetchMonthlyReport,
  fetchMonthlyTrend,
  fetchSpendingByCategory,
  invalidateReportCache
} from './api';

const monthlyReportKey = (month: string) => ['reports', 'monthly', month] as const;
const spendingByCategoryKey = (startDate: string, endDate: string) =>
  ['reports', 'spending-by-category', startDate, endDate] as const;
const monthlyTrendKey = (months: number) => ['reports', 'trend', months] as const;

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: monthlyReportKey(month),
    queryFn: () => fetchMonthlyReport(month),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function useSpendingByCategory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: spendingByCategoryKey(startDate, endDate),
    queryFn: () => fetchSpendingByCategory(startDate, endDate),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function useMonthlyTrend(months: number = 12) {
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

