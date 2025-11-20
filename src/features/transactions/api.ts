import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

import {
  accountSchema,
  categorySchema,
  transactionFiltersSchema,
  transactionFormSchema,
  transactionSchema,
  type Account,
  type Category,
  type Transaction,
  type TransactionFilters,
  type TransactionForm
} from './schema';

const accountListSchema = z.array(accountSchema);
const categoryListSchema = z.array(categorySchema);
const transactionListSchema = z.array(transactionSchema);

export async function fetchAccounts(includeBalances = true): Promise<Account[]> {
  const payload = await invoke<Account[]>('list_accounts', {
    payload: { includeBalances }
  });
  return accountListSchema.parse(payload);
}

export async function fetchCategories(): Promise<Category[]> {
  const payload = await invoke<Category[]>('list_categories');
  return categoryListSchema.parse(payload);
}

export async function fetchTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const parsedFilters = filters ? transactionFiltersSchema.parse(filters) : {};
  const payload = await invoke<Transaction[]>('list_transactions', { payload: parsedFilters });
  return transactionListSchema.parse(payload);
}

export async function createTransaction(data: TransactionForm): Promise<Transaction> {
  const payload = transactionFormSchema.parse(data);
  const result = await invoke<Transaction>('create_transaction', { payload });
  return transactionSchema.parse(result);
}

export async function updateTransaction(data: TransactionForm & { id: string }): Promise<Transaction> {
  const payload = transactionFormSchema.extend({ id: z.string() }).parse(data);
  const result = await invoke<Transaction>('update_transaction', { payload });
  return transactionSchema.parse(result);
}

export async function deleteTransaction(id: string): Promise<void> {
  await invoke('delete_transaction', { payload: { id } });
}

export async function importTransactions(items: TransactionForm[]): Promise<Transaction[]> {
  if (!items.length) {
    return [];
  }
  const parsedItems = z.array(transactionFormSchema).parse(items);
  const result = await invoke<Transaction[]>('import_transactions', {
    payload: { items: parsedItems }
  });
  return transactionListSchema.parse(result);
}

