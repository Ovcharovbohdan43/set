import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { accountSchema, categorySchema, transactionFiltersSchema, transactionFormSchema, transactionSchema } from './schema';
const accountListSchema = z.array(accountSchema);
const categoryListSchema = z.array(categorySchema);
const transactionListSchema = z.array(transactionSchema);
export async function fetchAccounts(includeBalances = true) {
    const payload = await invoke('list_accounts', {
        payload: { includeBalances }
    });
    return accountListSchema.parse(payload);
}
export async function fetchCategories() {
    const payload = await invoke('list_categories');
    return categoryListSchema.parse(payload);
}
export async function fetchTransactions(filters) {
    const parsedFilters = filters ? transactionFiltersSchema.parse(filters) : {};
    const payload = await invoke('list_transactions', { payload: parsedFilters });
    return transactionListSchema.parse(payload);
}
export async function createTransaction(data) {
    const payload = transactionFormSchema.parse(data);
    const result = await invoke('create_transaction', { payload });
    return transactionSchema.parse(result);
}
export async function updateTransaction(data) {
    const payload = transactionFormSchema.extend({ id: z.string() }).parse(data);
    const result = await invoke('update_transaction', { payload });
    return transactionSchema.parse(result);
}
export async function deleteTransaction(id) {
    await invoke('delete_transaction', { payload: { id } });
}
export async function importTransactions(items) {
    if (!items.length) {
        return [];
    }
    const parsedItems = z.array(transactionFormSchema).parse(items);
    const result = await invoke('import_transactions', {
        payload: { items: parsedItems }
    });
    return transactionListSchema.parse(result);
}
