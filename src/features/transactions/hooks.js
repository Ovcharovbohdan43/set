import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransaction, deleteTransaction, fetchAccounts, fetchCategories, fetchTransactions, importTransactions, updateTransaction } from './api';
import { transactionFiltersSchema } from './schema';
import { AppEvents, emitAppEvent } from '@/utils/events';
const transactionsKeys = {
    all: ['transactions'],
    list: (filters) => [...transactionsKeys.all, 'list', filters],
    accounts: ['transactions', 'accounts'],
    categories: ['transactions', 'categories']
};
export function useAccountsQuery() {
    return useQuery({
        queryKey: transactionsKeys.accounts,
        queryFn: () => fetchAccounts(true)
    });
}
export function useCategoriesQuery() {
    return useQuery({
        queryKey: transactionsKeys.categories,
        queryFn: fetchCategories
    });
}
export function useTransactionsQuery(filters) {
    const parsed = transactionFiltersSchema.parse(filters);
    return useQuery({
        queryKey: transactionsKeys.list(parsed),
        queryFn: () => fetchTransactions(parsed)
    });
}
export function useCreateTransactionMutation(filters) {
    const queryClient = useQueryClient();
    const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));
    return useMutation({
        mutationFn: createTransaction,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key) ?? [];
            const optimistic = buildOptimisticTransaction(variables);
            queryClient.setQueryData(key, [optimistic, ...previous]);
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(key, context.previous);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: key });
            emitAppEvent(AppEvents.transactionsChanged);
        }
    });
}
export function useUpdateTransactionMutation(filters) {
    const queryClient = useQueryClient();
    const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));
    return useMutation({
        mutationFn: updateTransaction,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key) ?? [];
            const optimistic = buildOptimisticTransaction(variables);
            queryClient.setQueryData(key, previous.map((item) => (item.id === variables.id ? optimistic : item)));
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(key, context.previous);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: key });
            emitAppEvent(AppEvents.transactionsChanged);
        }
    });
}
export function useDeleteTransactionMutation(filters) {
    const queryClient = useQueryClient();
    const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));
    return useMutation({
        mutationFn: deleteTransaction,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key) ?? [];
            queryClient.setQueryData(key, previous.filter((transaction) => transaction.id !== id));
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(key, context.previous);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: key });
            emitAppEvent(AppEvents.transactionsChanged);
        }
    });
}
export function useImportTransactionsMutation(filters) {
    const queryClient = useQueryClient();
    const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));
    return useMutation({
        mutationFn: importTransactions,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: key });
            emitAppEvent(AppEvents.transactionsChanged);
        }
    });
}
function buildOptimisticTransaction(data) {
    const id = data.id ?? `temp-${Date.now()}`;
    return {
        id,
        accountId: data.accountId,
        accountName: data.accountId,
        categoryId: data.categoryId ?? undefined,
        categoryName: data.categoryId ?? undefined,
        type: data.type,
        amountCents: data.amountCents,
        currency: data.currency,
        occurredOn: data.occurredOn,
        cleared: data.cleared ?? false,
        notes: data.notes ?? undefined,
        tags: data.tags ?? [],
        goalId: data.goalId ?? undefined
    };
}
