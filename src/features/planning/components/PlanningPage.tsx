import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/Toast";
import { ErrorContexts, getErrorMessage, getErrorTitle } from "@/utils/errors";

import {
  useAddDebtAccountMutation,
  useAddPlannedExpenseMutation,
  useAddPlannedIncomeMutation,
  useAddPlannedSavingMutation,
  useConfirmDebtPaymentMutation,
  useCreateMonthlyPlanMutation,
  useDebtAccountsQuery,
  useDebtScheduleQuery,
  useDeleteDebtAccountMutation,
  useDeletePlannedExpenseMutation,
  useDeletePlannedIncomeMutation,
  useDeletePlannedSavingMutation,
  useGenerateDebtScheduleMutation,
  useMonthlyPlansQuery,
  usePlanVsActualQuery,
  usePlannedExpensesQuery,
  usePlannedIncomesQuery,
  usePlannedSavingsQuery,
  useUpdateDebtAccountMutation,
  useUpdatePlannedExpenseMutation,
  useUpdatePlannedIncomeMutation,
  useUpdatePlannedSavingMutation
} from "../hooks";
import type { CreateMonthlyPlan } from "../schema";
import { useAccountsQuery, useCategoriesQuery } from "@/features/transactions/hooks";
import { useGoalsQuery } from "@/features/goals/hooks";
import { Chart } from "@/features/reports/components/Chart";

function formatMonthLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

type IncomeFormState = {
  id?: string;
  sourceName: string;
  type: string;
  expectedAmount: string;
  expectedDate: string;
  accountId: string;
};

type ExpenseFormState = {
  id?: string;
  label: string;
  categoryId: string;
  expectedAmount: string;
  frequency: string;
};

type SavingFormState = {
  id?: string;
  goalId: string;
  expectedAmount: string;
  actualAmount: string;
};

type DebtFormState = {
  id?: string;
  name: string;
  type: string;
  principal: string;
  interestRate: string;
  minMonthlyPayment: string;
  dueDay: string;
  startDate: string;
  currentBalance?: string;
};

const defaultIncome: IncomeFormState = {
  sourceName: "",
  type: "salary",
  expectedAmount: "",
  expectedDate: "",
  accountId: ""
};
const defaultExpense: ExpenseFormState = {
  label: "",
  categoryId: "",
  expectedAmount: "",
  frequency: "once"
};
const defaultSaving: SavingFormState = {
  goalId: "",
  expectedAmount: "",
  actualAmount: ""
};
const defaultDebt: DebtFormState = {
  name: "",
  type: "loan",
  principal: "",
  interestRate: "",
  minMonthlyPayment: "",
  dueDay: "1",
  startDate: new Date().toISOString().slice(0, 10),
  currentBalance: ""
};

export function PlanningPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: plans, isLoading: plansLoading } = useMonthlyPlansQuery();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(plans?.[0]?.id);
  const [selectedDebtId, setSelectedDebtId] = useState<string | undefined>();
  const [confirmAccountId, setConfirmAccountId] = useState<string>("");
  const [confirmCategoryId, setConfirmCategoryId] = useState<string>("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const isCreatingPlanRef = useRef(false);
  const { mutateAsync: createPlan } = useCreateMonthlyPlanMutation();

  const { data: accounts } = useAccountsQuery();
  const { data: categories } = useCategoriesQuery();
  const { data: goals } = useGoalsQuery();

  const { data: incomes } = usePlannedIncomesQuery(selectedPlanId);
  const { data: expenses } = usePlannedExpensesQuery(selectedPlanId);
  const { data: savings } = usePlannedSavingsQuery(selectedPlanId);
  const { data: debts } = useDebtAccountsQuery();
  const { data: planActual } = usePlanVsActualQuery(selectedPlanId);
  const scheduleQuery = useDebtScheduleQuery(selectedDebtId);

  const { mutateAsync: addIncome } = useAddPlannedIncomeMutation(selectedPlanId);
  const { mutateAsync: updateIncome } = useUpdatePlannedIncomeMutation(selectedPlanId);
  const { mutateAsync: removeIncome } = useDeletePlannedIncomeMutation(selectedPlanId);

  const { mutateAsync: addExpense } = useAddPlannedExpenseMutation(selectedPlanId);
  const { mutateAsync: updateExpense } = useUpdatePlannedExpenseMutation(selectedPlanId);
  const { mutateAsync: removeExpense } = useDeletePlannedExpenseMutation(selectedPlanId);

  const { mutateAsync: addSaving } = useAddPlannedSavingMutation(selectedPlanId);
  const { mutateAsync: updateSaving } = useUpdatePlannedSavingMutation(selectedPlanId);
  const { mutateAsync: removeSaving } = useDeletePlannedSavingMutation(selectedPlanId);

  const { mutateAsync: addDebt } = useAddDebtAccountMutation();
  const { mutateAsync: updateDebt } = useUpdateDebtAccountMutation();
  const { mutateAsync: removeDebt } = useDeleteDebtAccountMutation();

  // Wrapper functions for delete operations with error handling
  const handleDeleteIncome = useCallback(async (id: string) => {
    try {
      await removeIncome(id);
      toast.showSuccess("Income Deleted", "Planned income has been removed from the plan");
      await queryClient.invalidateQueries({ queryKey: ['planning', 'incomes', selectedPlanId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', selectedPlanId] });
    } catch (error) {
      console.error("Failed to delete income:", error);
      toast.showError(getErrorTitle(error, ErrorContexts.deleteIncome), getErrorMessage(error));
    }
  }, [removeIncome, toast, queryClient, selectedPlanId]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try {
      await removeExpense(id);
      toast.showSuccess("Expense Deleted", "Planned expense has been removed from the plan");
      await queryClient.invalidateQueries({ queryKey: ['planning', 'expenses', selectedPlanId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', selectedPlanId] });
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.showError(getErrorTitle(error, ErrorContexts.deleteExpense), getErrorMessage(error));
    }
  }, [removeExpense, toast, queryClient, selectedPlanId]);

  const handleDeleteSaving = useCallback(async (id: string) => {
    try {
      await removeSaving(id);
      toast.showSuccess("Savings Deleted", "Planned savings have been removed from the plan");
      await queryClient.invalidateQueries({ queryKey: ['planning', 'savings', selectedPlanId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', selectedPlanId] });
    } catch (error) {
      console.error("Failed to delete saving:", error);
      toast.showError(getErrorTitle(error, ErrorContexts.deleteSaving), getErrorMessage(error));
    }
  }, [removeSaving, toast, queryClient, selectedPlanId]);

  const handleDeleteDebt = useCallback(async (id: string) => {
    try {
      await removeDebt(id);
      toast.showSuccess("Debt Deleted", "Debt account has been removed successfully");
    } catch (error) {
      console.error("Failed to delete debt:", error);
      toast.showError(getErrorTitle(error, ErrorContexts.deleteDebt), getErrorMessage(error));
    }
  }, [removeDebt, toast]);
  const { mutateAsync: generateSchedule } = useGenerateDebtScheduleMutation();
  const { mutateAsync: confirmPayment } = useConfirmDebtPaymentMutation(selectedDebtId, selectedPlanId);

  const [incomeForm, setIncomeForm] = useState<IncomeFormState>(defaultIncome);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(defaultExpense);
  const [savingForm, setSavingForm] = useState<SavingFormState>(defaultSaving);
  const [debtForm, setDebtForm] = useState<DebtFormState>(defaultDebt);

  const selectedPlan = useMemo(
    () => plans?.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );
  // Fix: planReady should be true only when selectedPlanId exists
  const planReady = Boolean(selectedPlanId);

  const planOptions = useMemo(
    () =>
      (plans ?? []).map((plan) => ({
        id: plan.id,
        label: formatMonthLabel(plan.month)
      })),
    [plans]
  );

  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0]?.id);
    }
  }, [plans, selectedPlanId]);

  // Fix: use useCallback for handleCreatePlan to avoid stale closure
  const handleCreatePlan = useCallback(async () => {
    if (isCreatingPlanRef.current) {
      console.log("Plan creation already in progress");
      return;
    }
    isCreatingPlanRef.current = true;
    setIsCreatingPlan(true);
    try {
      console.log("Creating plan...");
      const now = new Date();
      const monthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const payload: CreateMonthlyPlan = {
        month: monthIso,
        totalPlannedIncome: 0,
        totalPlannedExpenses: 0,
        totalPlannedSavings: 0
      };
      console.log("Plan payload:", payload);
      const plan = await createPlan(payload);
      console.log("Plan created successfully:", plan);
      setSelectedPlanId(plan.id);
      // Invalidate plans query to refresh the list - this should trigger a re-render
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plans'] });
      // Refetch plans to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['planning', 'plans'] });
      console.log("Plan queries invalidated and refetched");
      toast.showSuccess("Plan Created", `Plan for ${formatMonthLabel(plan.month)} has been created successfully`);
      return plan;
    } catch (error) {
      console.error("Failed to create plan:", error);
      const errorMessage = getErrorMessage(error);
      toast.showError(getErrorTitle(error, ErrorContexts.createPlan), errorMessage);
      throw error;
    } finally {
      isCreatingPlanRef.current = false;
      setIsCreatingPlan(false);
    }
  }, [createPlan, queryClient, toast]);

  useEffect(() => {
    if (debts && debts.length > 0 && !selectedDebtId) {
      setSelectedDebtId(debts[0]?.id);
    }
  }, [debts, selectedDebtId]);

  const ensurePlanId = useCallback(async (): Promise<string | undefined> => {
    if (selectedPlanId) return selectedPlanId;
    if (plans && plans.length > 0) {
      const firstPlanId = plans[0]?.id;
      if (firstPlanId) {
        setSelectedPlanId(firstPlanId);
        return firstPlanId;
      }
    }
    try {
      const plan = await handleCreatePlan();
      return plan?.id;
    } catch (error) {
      console.error("Failed to ensure plan:", error);
      // Error already shown in handleCreatePlan
      return undefined;
    }
  }, [selectedPlanId, plans, handleCreatePlan]);

  const handleSubmitIncome = async () => {
    try {
      const planId = await ensurePlanId();
      if (!planId) {
        toast.showError("Error", "Failed to determine plan. Please create a new plan.");
        return;
      }
      
      // Validate required fields
      const sourceName = incomeForm.sourceName.trim();
      if (!sourceName) {
        toast.showError("Validation Error", "Please enter a source name.");
        return;
      }
      
      const expectedAmount = Number(incomeForm.expectedAmount);
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        toast.showError("Validation Error", "Please enter a valid amount greater than 0.");
        return;
      }
      
      // Fix: Update selectedPlanId if it was just created
      if (!selectedPlanId) {
        setSelectedPlanId(planId);
      }
      const payload = {
        monthlyPlanId: planId,
        sourceName: sourceName,
        type: incomeForm.type || "other",
        expectedAmount: expectedAmount,
        expectedDate: incomeForm.expectedDate || undefined,
        accountId: incomeForm.accountId || undefined
      };
      if (incomeForm.id) {
        await updateIncome({ id: incomeForm.id, sourceName: payload.sourceName, type: payload.type, expectedAmount: payload.expectedAmount, expectedDate: payload.expectedDate, accountId: payload.accountId });
        toast.showSuccess("Income Updated", `${payload.sourceName} has been updated successfully`);
      } else {
        await addIncome(payload);
        toast.showSuccess("Income Added", `${payload.sourceName} has been added to the plan`);
      }
      // Fix: Manually invalidate queries to ensure UI updates even if planId was just created
      await queryClient.invalidateQueries({ queryKey: ['planning', 'incomes', planId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      setIncomeForm(defaultIncome);
    } catch (error) {
      console.error("Failed to submit income:", error);
      const errorMessage = getErrorMessage(error);
      const context = incomeForm.id ? ErrorContexts.updateIncome : ErrorContexts.createIncome;
      toast.showError(getErrorTitle(error, context), errorMessage);
    }
  };

  const handleSubmitExpense = async () => {
    try {
      const planId = await ensurePlanId();
      if (!planId) {
        toast.showError("Error", "Failed to determine plan. Please create a new plan.");
        return;
      }
      
      // Validate required fields
      const label = expenseForm.label.trim();
      if (!label) {
        toast.showError("Validation Error", "Please enter an expense name.");
        return;
      }
      
      const expectedAmount = Number(expenseForm.expectedAmount);
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        toast.showError("Validation Error", "Please enter a valid amount greater than 0.");
        return;
      }
      
      // Fix: Update selectedPlanId if it was just created
      if (!selectedPlanId) {
        setSelectedPlanId(planId);
      }
      const payload = {
        monthlyPlanId: planId,
        label: label,
        categoryId: expenseForm.categoryId || undefined,
        expectedAmount: expectedAmount,
        frequency: expenseForm.frequency || "once"
      };
      if (expenseForm.id) {
        await updateExpense({ id: expenseForm.id, label: payload.label, categoryId: payload.categoryId, expectedAmount: payload.expectedAmount, frequency: payload.frequency });
        toast.showSuccess("Expense Updated", `${payload.label} has been updated successfully`);
      } else {
        await addExpense(payload);
        toast.showSuccess("Expense Added", `${payload.label} has been added to the plan`);
      }
      // Fix: Manually invalidate queries to ensure UI updates even if planId was just created
      await queryClient.invalidateQueries({ queryKey: ['planning', 'expenses', planId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      setExpenseForm(defaultExpense);
    } catch (error) {
      console.error("Failed to submit expense:", error);
      const errorMessage = getErrorMessage(error);
      const context = expenseForm.id ? ErrorContexts.updateExpense : ErrorContexts.createExpense;
      toast.showError(getErrorTitle(error, context), errorMessage);
    }
  };

  const handleSubmitSaving = async () => {
    try {
      const planId = await ensurePlanId();
      if (!planId) {
        toast.showError("Error", "Failed to determine plan. Please create a new plan.");
        return;
      }
      
      // Validate required fields
      const expectedAmount = Number(savingForm.expectedAmount);
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        toast.showError("Validation Error", "Please enter a valid amount greater than 0.");
        return;
      }
      
      // Fix: Update selectedPlanId if it was just created
      if (!selectedPlanId) {
        setSelectedPlanId(planId);
      }
      const payload = {
        monthlyPlanId: planId,
        goalId: savingForm.goalId || undefined,
        expectedAmount: expectedAmount
      };
      if (savingForm.id) {
        await updateSaving({ id: savingForm.id, goalId: payload.goalId, expectedAmount: payload.expectedAmount, actualAmount: savingForm.actualAmount ? Number(savingForm.actualAmount) : undefined });
        toast.showSuccess("Savings Updated", "Planned savings have been updated successfully");
      } else {
        await addSaving(payload);
        toast.showSuccess("Savings Added", "Planned savings have been added to the plan");
      }
      // Fix: Manually invalidate queries to ensure UI updates even if planId was just created
      await queryClient.invalidateQueries({ queryKey: ['planning', 'savings', planId] });
      await queryClient.invalidateQueries({ queryKey: ['planning', 'plan-vs-actual', planId] });
      setSavingForm(defaultSaving);
    } catch (error) {
      console.error("Failed to submit saving:", error);
      const errorMessage = getErrorMessage(error);
      const context = savingForm.id ? ErrorContexts.updateSaving : ErrorContexts.createSaving;
      toast.showError(getErrorTitle(error, context), errorMessage);
    }
  };

  const handleSubmitDebt = async () => {
    try {
      // Validate required fields
      const name = debtForm.name.trim();
      if (!name) {
        toast.showError("Validation Error", "Please enter a debt name.");
        return;
      }
      
      const principal = Number(debtForm.principal);
      if (isNaN(principal) || principal <= 0) {
        toast.showError("Validation Error", "Please enter a valid principal amount greater than 0.");
        return;
      }
      
      const interestRate = Number(debtForm.interestRate);
      if (isNaN(interestRate) || interestRate < 0) {
        toast.showError("Validation Error", "Please enter a valid interest rate (0 or greater).");
        return;
      }
      
      const minMonthlyPayment = Number(debtForm.minMonthlyPayment);
      if (isNaN(minMonthlyPayment) || minMonthlyPayment <= 0) {
        toast.showError("Validation Error", "Please enter a valid minimum monthly payment greater than 0.");
        return;
      }
      
      const dueDay = Number(debtForm.dueDay);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        toast.showError("Validation Error", "Please enter a valid due day (1-31).");
        return;
      }

      // Normalize and validate start date (input type=date yields yyyy-mm-dd)
      const startDateIso = debtForm.startDate?.trim();
      if (!startDateIso) {
        toast.showError("Validation Error", "Please select a start date.");
        return;
      }
      // Basic ISO guard to avoid Zod "Required" from empty/invalid value
      const parsedDate = new Date(startDateIso);
      if (Number.isNaN(parsedDate.getTime())) {
        toast.showError("Validation Error", "Please select a valid start date.");
        return;
      }
      
      const base = {
        name: name,
        type: debtForm.type || "loan",
        principal: principal,
        interestRate: interestRate,
        minMonthlyPayment: minMonthlyPayment,
        dueDay: dueDay,
        startDate: startDateIso,
        currentBalance: Number(debtForm.currentBalance || debtForm.principal) || principal
      };
      if (debtForm.id) {
        await updateDebt({ id: debtForm.id, name: base.name, type: base.type, principal: base.principal, interestRate: base.interestRate, minMonthlyPayment: base.minMonthlyPayment, dueDay: base.dueDay, currentBalance: base.currentBalance });
        toast.showSuccess("Debt Updated", `${base.name} has been updated successfully`);
      } else {
        await addDebt(base);
        toast.showSuccess("Debt Added", `${base.name} has been added successfully`);
      }
      setDebtForm(defaultDebt);
    } catch (error) {
      console.error("Failed to submit debt:", error);
      const errorMessage = getErrorMessage(error);
      const context = debtForm.id ? ErrorContexts.updateDebt : ErrorContexts.createDebt;
      toast.showError(getErrorTitle(error, context), errorMessage);
    }
  };

  const handlePlanChange = (id: string) => {
    setSelectedPlanId(id || undefined);
    // Reset form state to avoid leaking edits between plans
    setIncomeForm(defaultIncome);
    setExpenseForm(defaultExpense);
    setSavingForm(defaultSaving);
  };

  // Remove duplicate useEffect - plan creation is handled in ensurePlan above

  const planChartOption = useMemo(() => {
    if (!planActual) return undefined;
    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Plan", "Actual"] },
      xAxis: { type: "category", data: ["Income", "Expense", "Savings"] },
      yAxis: { type: "value" },
      series: [
        { name: "Plan", type: "bar", data: [planActual.plannedIncome, planActual.plannedExpenses, planActual.plannedSavings ?? 0], itemStyle: { color: "#6366f1" } },
        { name: "Actual", type: "bar", data: [planActual.actualIncome, planActual.actualExpenses, planActual.actualSavings ?? 0], itemStyle: { color: "#22c55e" } }
      ]
    };
  }, [planActual]);

  // Show empty state when no plans exist AND no plan is selected (to handle case when plan is just created)
  const hasPlans = plans && plans.length > 0;
  const showEmptyState = !plansLoading && !hasPlans && !selectedPlanId;

  if (showEmptyState) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">No plans yet</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Create your first monthly plan to start tracking income, expenses, savings, and debt payment schedules.
          </p>
          <button
            type="button"
            onClick={async () => {
              console.log("Button clicked - creating plan");
              try {
                const plan = await handleCreatePlan();
                console.log("Plan created successfully, plan ID:", plan?.id);
                // After plan is created, selectedPlanId should be set, which will trigger re-render
                // The empty state will disappear because hasPlans will become true
              } catch (error) {
                // Error is already handled in handleCreatePlan (toast shown)
                console.error("Error in button handler:", error);
              }
            }}
            disabled={isCreatingPlan}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreatingPlan ? "Creating..." : "Create your first plan"}
          </button>
        </div>
      </section>
    );
  }

  // Show loading state while plans are being fetched
  if (plansLoading) {
    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Planning</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Planning</h2>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading plans...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Planning</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Planning</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Income, expenses, savings, and debt payment schedules.</p>
          {selectedPlan && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current plan: {formatMonthLabel(selectedPlan.month)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPlanId ?? ""}
            onChange={(e) => handlePlanChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="" disabled>
              Select plan
            </option>
            {planOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleCreatePlan()}
            disabled={isCreatingPlan}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreatingPlan ? "Creating..." : "New plan"}
          </button>
        </div>
      </header>

      {/* Only show sections when a plan is selected */}
      {selectedPlanId && (
        <>
          {planActual && planChartOption && <Chart option={planChartOption as any} height={240} />}

          <div className="grid gap-4 md:grid-cols-2">
            <IncomeSection
              accounts={accounts ?? []}
              incomes={incomes ?? []}
              form={incomeForm}
              setForm={setIncomeForm}
              onSubmit={handleSubmitIncome}
              onEdit={setIncomeForm}
              onDelete={handleDeleteIncome}
              planSelected={planReady}
            />
            <ExpenseSection
              categories={categories ?? []}
              expenses={expenses ?? []}
              form={expenseForm}
              setForm={setExpenseForm}
              onSubmit={handleSubmitExpense}
              onEdit={setExpenseForm}
              onDelete={handleDeleteExpense}
              planSelected={planReady}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SavingsSection
              goals={goals ?? []}
              savings={savings ?? []}
              form={savingForm}
              setForm={setSavingForm}
              onSubmit={handleSubmitSaving}
              onEdit={setSavingForm}
              onDelete={handleDeleteSaving}
              planSelected={planReady}
            />
            <DebtSection
              debts={debts ?? []}
              accounts={accounts ?? []}
              categories={categories ?? []}
              selectedDebtId={selectedDebtId}
              setSelectedDebtId={setSelectedDebtId}
              confirmAccountId={confirmAccountId}
              setConfirmAccountId={setConfirmAccountId}
              confirmCategoryId={confirmCategoryId}
              setConfirmCategoryId={setConfirmCategoryId}
              schedule={scheduleQuery.data ?? []}
              generateSchedule={generateSchedule}
              confirmPayment={confirmPayment}
              form={debtForm}
              setForm={setDebtForm}
              onSubmit={handleSubmitDebt}
              onEdit={setDebtForm}
              onDelete={handleDeleteDebt}
            />
          </div>
        </>
      )}

      {/* Show message when plan exists but not selected */}
      {hasPlans && !selectedPlanId && (
        <div className="flex items-center justify-center py-12 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please select a plan from the dropdown above to start planning.
          </p>
        </div>
      )}
    </section>
  );
}
type Account = { id: string; name: string; type: string };
type Category = { id: string; name: string };
type Goal = { id: string; name: string };
type Income = { id: string; sourceName: string; type: string; expectedAmount: number; expectedDate?: string | null; accountId?: string | null };
type Expense = { id: string; label: string; expectedAmount: number; frequency: string; categoryId?: string | null };
type Saving = { id: string; goalId?: string | null; expectedAmount: number; actualAmount: number };
type Debt = { id: string; name: string; type: string; principal: number; interestRate: number; minMonthlyPayment: number; dueDay: number; currentBalance: number };
type Schedule = { id: string; dueDate: string; plannedPayment: number; plannedInterest: number; plannedPrincipal: number; isPaid: boolean };

function IncomeSection(props: {
  accounts: Account[];
  incomes: Income[];
  form: IncomeFormState;
  setForm: (f: IncomeFormState) => void;
  onSubmit: () => void;
  onEdit: (f: IncomeFormState) => void;
  onDelete: (id: string) => Promise<void>;
  planSelected: boolean;
}) {
  const { accounts, incomes, form, setForm, onSubmit, onEdit, onDelete, planSelected } = props;
  // Fix: Validate form fields - button should be enabled when required fields are filled
  // Plan will be created automatically if missing (via ensurePlanId in handleSubmitIncome)
  const isFormValid = Boolean(
    form.sourceName.trim() && 
    form.expectedAmount && 
    Number(form.expectedAmount) > 0
  );
  const isButtonDisabled = !isFormValid;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Income</h4>
        <button type="button" onClick={() => setForm(defaultIncome)} className="text-xs text-primary hover:underline">
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Source" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
          <option value="salary">Salary</option>
          <option value="bonus">Bonus</option>
          <option value="side_job">Side job</option>
          <option value="other">Other</option>
        </select>
        <input value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Amount, GBP" type="number" step="0.01" min="0" />
        <input value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" type="date" />
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2">
          <option value="">Account (optional)</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} · {acc.type}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={isButtonDisabled} onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {form.id ? "Save" : "Add"}
        </button>
      </div>
      <div className="space-y-2">
        {incomes.map((income) => (
          <div key={income.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div>
              <div className="font-semibold">{income.sourceName}</div>
              <div className="text-xs text-slate-500">
                {income.expectedAmount.toLocaleString()} · {income.type}{" "}
                {income.accountId ? `· ${accounts.find((a) => a.id === income.accountId)?.name ?? "Account"}` : ""}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => onEdit({ id: income.id, sourceName: income.sourceName, type: income.type, expectedAmount: String(income.expectedAmount), expectedDate: income.expectedDate ?? "", accountId: income.accountId ?? "" })} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Edit
              </button>
              <button type="button" onClick={() => void onDelete(income.id)} className="rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
                Delete
              </button>
            </div>
          </div>
        ))}
        {incomes.length === 0 && <p className="text-xs text-slate-500">No planned income yet.</p>}
      </div>
    </div>
  );
}

function ExpenseSection(props: {
  categories: Category[];
  expenses: Expense[];
  form: ExpenseFormState;
  setForm: (f: ExpenseFormState) => void;
  onSubmit: () => void;
  onEdit: (f: ExpenseFormState) => void;
  onDelete: (id: string) => Promise<void>;
  planSelected: boolean;
}) {
  const { categories, expenses, form, setForm, onSubmit, onEdit, onDelete, planSelected } = props;
  // Fix: Validate form fields - button should be enabled when required fields are filled
  // Plan will be created automatically if missing (via ensurePlanId in handleSubmitExpense)
  const isFormValid = Boolean(
    form.label.trim() && 
    form.expectedAmount && 
    Number(form.expectedAmount) > 0
  );
  const isButtonDisabled = !isFormValid;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Expenses</h4>
        <button type="button" onClick={() => setForm(defaultExpense)} className="text-xs text-primary hover:underline">
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Expense name" />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
          <option value="">Category (optional)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Amount, GBP" type="number" step="0.01" min="0" />
        <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
          <option value="once">Once</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={isButtonDisabled} onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {form.id ? "Save" : "Add"}
        </button>
      </div>
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div>
              <div className="font-semibold">{expense.label}</div>
              <div className="text-xs text-slate-500">
                {expense.expectedAmount.toLocaleString()} · {expense.frequency === "once" ? "once" : expense.frequency}
                {expense.categoryId ? ` · ${categories.find((c) => c.id === expense.categoryId)?.name ?? "Category"}` : ""}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => onEdit({ id: expense.id, label: expense.label, categoryId: expense.categoryId ?? "", expectedAmount: String(expense.expectedAmount), frequency: expense.frequency })} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Edit
              </button>
              <button type="button" onClick={() => void onDelete(expense.id)} className="rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
                Delete
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && <p className="text-xs text-slate-500">No planned expenses yet.</p>}
      </div>
    </div>
  );
}

function SavingsSection(props: {
  goals: Goal[];
  savings: Saving[];
  form: SavingFormState;
  setForm: (f: SavingFormState) => void;
  onSubmit: () => void;
  onEdit: (f: SavingFormState) => void;
  onDelete: (id: string) => Promise<void>;
  planSelected: boolean;
}) {
  const { goals, savings, form, setForm, onSubmit, onEdit, onDelete, planSelected } = props;
  // Fix: Validate form fields - button should be enabled when required fields are filled
  // Plan will be created automatically if missing (via ensurePlanId in handleSubmitSaving)
  const isFormValid = Boolean(
    form.expectedAmount && 
    Number(form.expectedAmount) > 0
  );
  const isButtonDisabled = !isFormValid;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Savings</h4>
        <button type="button" onClick={() => setForm(defaultSaving)} className="text-xs text-primary hover:underline">
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2">
          <option value="">Goal (optional)</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.name}
            </option>
          ))}
        </select>
        <input value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Planned savings, GBP" type="number" step="0.01" min="0" />
        <input value={form.actualAmount} onChange={(e) => setForm({ ...form, actualAmount: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Actual (optional), GBP" type="number" step="0.01" min="0" />
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={isButtonDisabled} onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {form.id ? "Save" : "Add"}
        </button>
      </div>
      <div className="space-y-2">
        {savings.map((saving) => (
          <div key={saving.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div>
              <div className="font-semibold">{saving.goalId ? goals.find((g) => g.id === saving.goalId)?.name ?? "Saving" : "Saving"}</div>
              <div className="text-xs text-slate-500">
                Planned: {saving.expectedAmount.toLocaleString()} · Actual: {(saving.actualAmount ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => onEdit({ id: saving.id, goalId: saving.goalId ?? "", expectedAmount: String(saving.expectedAmount), actualAmount: saving.actualAmount ? String(saving.actualAmount) : "" })} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Edit
              </button>
              <button type="button" onClick={() => void onDelete(saving.id)} className="rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
                Delete
              </button>
            </div>
          </div>
        ))}
        {savings.length === 0 && <p className="text-xs text-slate-500">No planned savings yet.</p>}
      </div>
    </div>
  );
}

function DebtSection(props: {
  debts: Debt[];
  accounts: Account[];
  categories: Category[];
  selectedDebtId?: string;
  setSelectedDebtId: (id: string | undefined) => void;
  confirmAccountId: string;
  setConfirmAccountId: (v: string) => void;
  confirmCategoryId: string;
  setConfirmCategoryId: (v: string) => void;
  schedule: Schedule[];
  generateSchedule: (args: { debtAccountId: string }) => Promise<Schedule[]>;
  confirmPayment: (args: { scheduleId: string; accountId?: string; categoryId?: string }) => Promise<Schedule[]>;
  form: DebtFormState;
  setForm: (f: DebtFormState) => void;
  onSubmit: () => void;
  onEdit: (f: DebtFormState) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const {
    debts,
    accounts,
    categories,
    selectedDebtId,
    setSelectedDebtId,
    confirmAccountId,
    setConfirmAccountId,
    confirmCategoryId,
    setConfirmCategoryId,
    schedule,
    generateSchedule,
    confirmPayment,
    form,
    setForm,
    onSubmit,
    onEdit,
    onDelete
  } = props;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Debts and loans</h4>
        <button type="button" onClick={() => setForm(defaultDebt)} className="text-xs text-primary hover:underline">
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Name" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
          <option value="loan">Loan</option>
          <option value="credit_card">Credit card</option>
          <option value="overdraft">Overdraft</option>
        </select>
        <input value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Principal" type="number" step="0.01" min="0" />
        <input value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Interest %" type="number" step="0.01" min="0" max="100" />
        <input value={form.minMonthlyPayment} onChange={(e) => setForm({ ...form, minMonthlyPayment: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Min. payment" type="number" step="0.01" min="0" />
        <input value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Current balance" type="number" step="0.01" min="0" />
        <input value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Due day" type="number" min="1" max="31" />
        <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Start date" type="date" />
      </div>
      <div className="flex justify-end">
        {/* Fix: Validate form fields - button should be enabled when required fields are filled */}
        {(() => {
          const isFormValid = Boolean(
            form.name.trim() &&
            form.principal &&
            Number(form.principal) > 0 &&
            form.interestRate &&
            Number(form.interestRate) >= 0 &&
            form.minMonthlyPayment &&
            Number(form.minMonthlyPayment) > 0 &&
            form.dueDay &&
            Number(form.dueDay) >= 1 &&
            Number(form.dueDay) <= 31 &&
            form.startDate
          );
          return (
            <button type="button" disabled={!isFormValid} onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">
              {form.id ? "Save" : "Add"}
            </button>
          );
        })()}
      </div>
      <div className="space-y-2">
        {debts.map((debt) => (
          <div key={debt.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{debt.name}</div>
                <div className="text-xs text-slate-500">
                  Balance: {debt.currentBalance.toLocaleString()} · Rate: {debt.interestRate}% · Min payment: {debt.minMonthlyPayment.toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => onEdit({ id: debt.id, name: debt.name, type: debt.type, principal: String(debt.principal), interestRate: String(debt.interestRate), minMonthlyPayment: String(debt.minMonthlyPayment), dueDay: String(debt.dueDay), startDate: new Date().toISOString().slice(0, 10), currentBalance: String(debt.currentBalance) })} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                  Edit
                </button>
                <button type="button" onClick={() => void onDelete(debt.id)} className="rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10">
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setSelectedDebtId(debt.id)} className={`rounded-md px-3 py-1 text-xs font-semibold ${selectedDebtId === debt.id ? "bg-primary text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100"}`}>
                Schedule
              </button>
              <button type="button" onClick={() => void generateSchedule({ debtAccountId: debt.id })} className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/60">
                Recalculate schedule
              </button>
            </div>
          </div>
        ))}
        {debts.length === 0 && <p className="text-xs text-slate-500">No debts added yet.</p>}
      </div>

      {selectedDebtId && (
        <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-500/40 dark:bg-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-indigo-900 dark:text-indigo-100">Payment schedule</div>
            <div className="flex gap-2 text-xs">
              <select value={confirmAccountId} onChange={(e) => setConfirmAccountId(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900">
                <option value="">Account for posting</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <select value={confirmCategoryId} onChange={(e) => setConfirmCategoryId(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900">
                <option value="">Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {schedule.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <div className="text-xs text-slate-500">{formatMonthLabel(item.dueDate)}</div>
                  <div className="text-sm font-semibold">
                    {item.plannedPayment.toLocaleString()} (interest: {item.plannedInterest.toLocaleString()} / principal: {item.plannedPrincipal.toLocaleString()})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${item.isPaid ? "text-emerald-500" : "text-amber-500"}`}>{item.isPaid ? "Paid" : "Pending"}</span>
                  {!item.isPaid && (
                    <button
                      type="button"
                      onClick={() => void confirmPayment({ scheduleId: item.id, accountId: confirmAccountId || undefined, categoryId: confirmCategoryId || undefined })}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            ))}
            {schedule.length === 0 && <p className="text-xs text-slate-600">Generate a schedule for the selected debt to see payments.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
