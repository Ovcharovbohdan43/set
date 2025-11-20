import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query';

import {
  createTransaction,
  deleteTransaction,
  fetchAccounts,
  fetchCategories,
  fetchTransactions,
  importTransactions,
  updateTransaction
} from './api';
import {
  transactionFiltersSchema,
  type Account,
  type Category,
  type Transaction,
  type TransactionFilters,
  type TransactionForm
} from './schema';

const transactionsKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => [...transactionsKeys.all, 'list', filters] as const,
  accounts: ['transactions', 'accounts'] as const,
  categories: ['transactions', 'categories'] as const
};

export function useAccountsQuery(): UseQueryResult<Account[]> {
  return useQuery({
    queryKey: transactionsKeys.accounts,
    queryFn: () => fetchAccounts(true)
  });
}

export function useCategoriesQuery(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: transactionsKeys.categories,
    queryFn: fetchCategories
  });
}

export function useTransactionsQuery(
  filters: TransactionFilters
): UseQueryResult<Transaction[]> {
  const parsed = transactionFiltersSchema.parse(filters);
  return useQuery({
    queryKey: transactionsKeys.list(parsed),
    queryFn: () => fetchTransactions(parsed)
  });
}

export function useCreateTransactionMutation(
  filters: TransactionFilters
): UseMutationResult<Transaction, unknown, TransactionForm> {
  const queryClient = useQueryClient();
  const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));

  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Transaction[]>(key) ?? [];
      const optimistic = buildOptimisticTransaction(variables);
      queryClient.setQueryData<Transaction[]>(key, [optimistic, ...previous]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  });
}

export function useUpdateTransactionMutation(
  filters: TransactionFilters
): UseMutationResult<Transaction, unknown, TransactionForm & { id: string }> {
  const queryClient = useQueryClient();
  const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));

  return useMutation({
    mutationFn: updateTransaction,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Transaction[]>(key) ?? [];
      const optimistic = buildOptimisticTransaction(variables);
      queryClient.setQueryData<Transaction[]>(
        key,
        previous.map((item) => (item.id === variables.id ? optimistic : item))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  });
}

export function useDeleteTransactionMutation(
  filters: TransactionFilters
): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));

  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Transaction[]>(key) ?? [];
      queryClient.setQueryData(
        key,
        previous.filter((transaction) => transaction.id !== id)
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  });
}

export function useImportTransactionsMutation(
  filters: TransactionFilters
): UseMutationResult<Transaction[], unknown, TransactionForm[]> {
  const queryClient = useQueryClient();
  const key = transactionsKeys.list(transactionFiltersSchema.parse(filters));

  return useMutation({
    mutationFn: importTransactions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  });
}

function buildOptimisticTransaction(data: TransactionForm & { id?: string }): Transaction {
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

