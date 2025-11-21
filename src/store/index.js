import { create } from 'zustand';
import { transactionFiltersSchema } from '@/features/transactions/schema';
export const useAppStore = create((set) => ({
    isOffline: false,
    setOffline: (value) => set({ isOffline: value }),
    transactionFilters: {},
    setTransactionFilters: (value) => set({ transactionFilters: transactionFiltersSchema.parse(value) })
}));
