import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addPlannedExpense,
  addPlannedIncome,
  addDebtAccount,
  addPlannedSaving,
  createMonthlyPlan,
  generateDebtSchedule,
  fetchDebtSchedule,
  confirmDebtPayment,
  deleteDebtAccount,
  deletePlannedExpense,
  deletePlannedIncome,
  deletePlannedSaving,
  fetchPlanVsActual,
  listDebtAccounts,
  listMonthlyPlans,
  listPlannedExpenses,
  listPlannedIncomes,
  listPlannedSavings,
  updateDebtAccount,
  updatePlannedExpense,
  updatePlannedIncome,
  updatePlannedSaving
} from './api';
import type {
  AddPlannedExpense,
  AddPlannedIncome,
  CreateMonthlyPlan,
  UpdateDebtAccount,
  AddDebtAccount,
  UpdatePlannedExpense,
  UpdatePlannedIncome,
  AddPlannedSaving,
  UpdatePlannedSaving,
  PlanActual,
  GenerateDebtSchedule,
  ConfirmDebtPayment,
  DebtSchedule
} from './schema';

export function useMonthlyPlansQuery() {
  return useQuery({
    queryKey: ['planning', 'plans'],
    queryFn: listMonthlyPlans
  });
}

export function useCreateMonthlyPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMonthlyPlan) => createMonthlyPlan(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['planning', 'plans'] });
    }
  });
}

export function usePlannedIncomesQuery(planId?: string) {
  return useQuery({
    queryKey: ['planning', 'incomes', planId],
    queryFn: () => listPlannedIncomes(planId!),
    enabled: Boolean(planId)
  });
}

export function useAddPlannedIncomeMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPlannedIncome) => addPlannedIncome(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'incomes', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useUpdatePlannedIncomeMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlannedIncome) => updatePlannedIncome(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'incomes', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useDeletePlannedIncomeMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlannedIncome(id),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'incomes', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function usePlannedExpensesQuery(planId?: string) {
  return useQuery({
    queryKey: ['planning', 'expenses', planId],
    queryFn: () => listPlannedExpenses(planId!),
    enabled: Boolean(planId)
  });
}

export function useAddPlannedExpenseMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPlannedExpense) => addPlannedExpense(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'expenses', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useUpdatePlannedExpenseMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlannedExpense) => updatePlannedExpense(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'expenses', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useDeletePlannedExpenseMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlannedExpense(id),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'expenses', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useDebtAccountsQuery() {
  return useQuery({
    queryKey: ['planning', 'debts'],
    queryFn: listDebtAccounts
  });
}

export function useAddDebtAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddDebtAccount) => addDebtAccount(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['planning', 'debts'] });
    }
  });
}

export function useUpdateDebtAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDebtAccount) => updateDebtAccount(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['planning', 'debts'] });
    }
  });
}

export function useDeleteDebtAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDebtAccount(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['planning', 'debts'] });
    }
  });
}

export function usePlanVsActualQuery(planId?: string) {
  return useQuery<PlanActual>({
    queryKey: ['planning', 'plan-vs-actual', planId],
    queryFn: () => fetchPlanVsActual(planId!),
    enabled: Boolean(planId)
  });
}

export function useDebtScheduleQuery(debtId?: string) {
  return useQuery<DebtSchedule[]>({
    queryKey: ['planning', 'debt-schedule', debtId],
    queryFn: () => fetchDebtSchedule(debtId!),
    enabled: Boolean(debtId)
  });
}

export function useGenerateDebtScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateDebtSchedule) => generateDebtSchedule(input),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['planning', 'debt-schedule', variables.debtAccountId] });
    }
  });
}

export function useConfirmDebtPaymentMutation(debtId?: string, planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmDebtPayment) => confirmDebtPayment(input),
    onSuccess: () => {
      if (debtId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'debt-schedule', debtId] });
      }
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function usePlannedSavingsQuery(planId?: string) {
  return useQuery({
    queryKey: ['planning', 'savings', planId],
    queryFn: () => listPlannedSavings(planId!),
    enabled: Boolean(planId)
  });
}

export function useAddPlannedSavingMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPlannedSaving) => addPlannedSaving(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'savings', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useUpdatePlannedSavingMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlannedSaving) => updatePlannedSaving(input),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'savings', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}

export function useDeletePlannedSavingMutation(planId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlannedSaving(id),
    onSuccess: () => {
      if (planId) {
        void qc.invalidateQueries({ queryKey: ['planning', 'savings', planId] });
        void qc.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      }
    }
  });
}
