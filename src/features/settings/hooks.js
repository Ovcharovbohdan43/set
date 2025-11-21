import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateCategoryOrder, updateUserSettings } from './api';
export function useUserSettingsQuery() {
    return useQuery({
        queryKey: ['userSettings'],
        queryFn: getUserSettings,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 3, // Retry up to 3 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        refetchOnWindowFocus: false // Don't refetch on window focus to avoid unnecessary requests
    });
}
export function useUpdateUserSettingsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateUserSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
        }
    });
}
export function useUpdateCategoryOrderMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCategoryOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
}
