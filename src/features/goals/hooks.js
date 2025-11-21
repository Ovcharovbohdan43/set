import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvents } from '@/utils/events';
import { addContribution, createGoal, deleteGoal, fetchGoal, fetchGoals, updateGoal, updateGoalStatus } from './api';
const goalsKey = ['goals'];
const goalKey = (id) => ['goals', id];
export function useGoalsQuery() {
    return useQuery({
        queryKey: goalsKey,
        queryFn: fetchGoals,
        staleTime: 1000 * 30
    });
}
export function useGoalQuery(id) {
    return useQuery({
        queryKey: goalKey(id),
        queryFn: () => fetchGoal(id),
        enabled: !!id,
        staleTime: 1000 * 30
    });
}
export function useCreateGoalMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createGoal,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: goalsKey });
            window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
        }
    });
}
export function useUpdateGoalMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateGoal,
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: goalsKey });
            await queryClient.invalidateQueries({ queryKey: goalKey(data.id) });
            window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
        }
    });
}
export function useUpdateGoalStatusMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateGoalStatus,
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: goalsKey });
            await queryClient.invalidateQueries({ queryKey: goalKey(data.id) });
            window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
        }
    });
}
export function useAddContributionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addContribution,
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: goalsKey });
            await queryClient.invalidateQueries({ queryKey: goalKey(data.id) });
            window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
        }
    });
}
export function useDeleteGoalMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteGoal,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: goalsKey });
            window.dispatchEvent(new CustomEvent(AppEvents.transactionsChanged));
        }
    });
}
