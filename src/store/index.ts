import { create } from 'zustand';

import {
  transactionFiltersSchema,
  type TransactionFilters
} from '@/features/transactions/schema';

interface AppState {
  isOffline: boolean;
  setOffline: (value: boolean) => void;
  transactionFilters: TransactionFilters;
  setTransactionFilters: (value: TransactionFilters) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: false,
  setOffline: (value) => set({ isOffline: value }),
  transactionFilters: {},
  setTransactionFilters: (value) =>
    set({ transactionFilters: transactionFiltersSchema.parse(value) })
}));

