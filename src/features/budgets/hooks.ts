import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppEvents } from '@/utils/events';

import {
  createBudget,
  deleteBudget,
  fetchBudget,
  fetchBudgets,
  recordSnapshot,
  updateBudget
} from './api';

const budgetsKey = ['budgets'] as const;
const budgetKey = (id: string) => ['budgets', id] as const;

export function useBudgetsQuery() {
  return useQuery({
    queryKey: budgetsKey,
    queryFn: fetchBudgets,
    staleTime: 1000 * 30
  });
}

export function useBudgetQuery(id: string) {
  return useQuery({
    queryKey: budgetKey(id),
    queryFn: () => fetchBudget(id),
    enabled: !!id,
    staleTime: 1000 * 30
  });
}

export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetsKey });
      // Emit event for dashboard updates
      window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
    }
  });
}

export function useUpdateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBudget,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: budgetsKey });
      await queryClient.invalidateQueries({ queryKey: budgetKey(data.id) });
      window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
    }
  });
}

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetsKey });
      window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
    }
  });
}

export function useRecordSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      actualCents,
      projectedCents,
      snapshotDate
    }: {
      budgetId: string;
      actualCents: number;
      projectedCents: number;
      snapshotDate: string;
    }) => recordSnapshot(budgetId, actualCents, projectedCents, snapshotDate),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: budgetsKey });
      await queryClient.invalidateQueries({ queryKey: budgetKey(data.budgetId) });
    }
  });
}

