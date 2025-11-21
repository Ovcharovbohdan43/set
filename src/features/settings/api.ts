import { invoke } from '@tauri-apps/api/core';

import { importTransactions } from '@/features/transactions/api';
import type { TransactionForm } from '@/features/transactions/schema';
import { transactionFormSchema } from '@/features/transactions/schema';

import {
  updateCategoryOrderSchema,
  updateUserSettingsSchema,
  userSettingsSchema,
  type UpdateCategoryOrder,
  type UpdateUserSettings,
  type UserSettings
} from './schema';

export async function getUserSettings(): Promise<UserSettings> {
  const payload = await invoke<UserSettings>('get_user_settings');
  return userSettingsSchema.parse(payload);
}

export async function updateUserSettings(data: UpdateUserSettings): Promise<UserSettings> {
  const payload = updateUserSettingsSchema.parse(data);
  const result = await invoke<UserSettings>('update_user_settings', { input: payload });
  return userSettingsSchema.parse(result);
}

export async function updateCategoryOrder(data: UpdateCategoryOrder): Promise<void> {
  const payload = updateCategoryOrderSchema.parse(data);
  await invoke('update_category_order', { input: payload });
}

export interface ImportFileResult {
  contents: string;
  format: string;
}

export interface ImportValidationResult {
  valid: TransactionForm[];
  errors: Array<{ row: number; field?: string; message: string }>;
}

/**
 * Read import file from file system
 */
export async function readImportFile(filePath: string): Promise<ImportFileResult> {
  return await invoke<ImportFileResult>('read_import_file', {
    payload: { filePath }
  });
}

/**
 * Decrypt encrypted JSON file
 */
export async function decryptEncryptedJson(filePath: string): Promise<string> {
  return await invoke<string>('decrypt_encrypted_json', {
    payload: { filePath }
  });
}

/**
 * Open file dialog for import (placeholder - requires Tauri dialog plugin)
 * For now, use file input in UI to get file path
 */
export async function openImportFileDialog(): Promise<string | null> {
  // TODO: Implement with @tauri-apps/plugin-dialog when available
  // For now, return null - file path should come from UI file input
  return null;
}

/**
 * Parse and validate CSV content
 */
export function parseAndValidateCsv(csvContent: string): ImportValidationResult {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    return {
      valid: [],
      errors: [{ row: 0, message: 'CSV file must contain at least a header and one data row' }]
    };
  }

  // Parse CSV header (expected: date,account,category,type,amount,currency,notes)
  const headerLine = lines[0];
  if (!headerLine) {
    throw new Error('CSV file is empty');
  }
  const header = headerLine.split(',').map((h) => h.trim().toLowerCase());
  const valid: TransactionForm[] = [];
  const errors: Array<{ row: number; field?: string; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(',').map((v) => v.trim());

    if (values.length < header.length) {
      errors.push({
        row: i + 1,
        message: `Row ${i + 1}: Missing required fields`
      });
      continue;
    }

    // Build transaction object
    const transaction: Partial<TransactionForm> = {
      occurredOn: values[0] || new Date().toISOString(),
      accountId: values[1] || '',
      categoryId: values[2] || null,
      type: (values[3] || 'expense') as 'income' | 'expense' | 'transfer',
      amountCents: Math.round(parseFloat(values[4] || '0') * 100),
      currency: values[5] || 'USD',
      notes: values[6] || null
    };

    // Validate with Zod
    const result = transactionFormSchema.safeParse(transaction);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        row: i + 1,
        field: result.error.errors[0]?.path.join('.'),
        message: result.error.errors[0]?.message || 'Validation failed'
      });
    }
  }

  return { valid, errors };
}

/**
 * Parse and validate JSON content
 */
export function parseAndValidateJson(jsonContent: string): ImportValidationResult {
  try {
    const json = JSON.parse(jsonContent);
    const transactionsArray = json.transactions || (Array.isArray(json) ? json : []);

    if (!Array.isArray(transactionsArray)) {
      return {
        valid: [],
        errors: [{ row: 0, message: 'JSON must contain a transactions array' }]
      };
    }

    const valid: TransactionForm[] = [];
    const errors: Array<{ row: number; field?: string; message: string }> = [];

    transactionsArray.forEach((item: unknown, index: number) => {
      const result = transactionFormSchema.safeParse(item);
      if (result.success) {
        valid.push(result.data);
      } else {
        errors.push({
          row: index + 1,
          field: result.error.errors[0]?.path.join('.'),
          message: result.error.errors[0]?.message || 'Validation failed'
        });
      }
    });

    return { valid, errors };
  } catch (error) {
    return {
      valid: [],
      errors: [{ row: 0, message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}

/**
 * Import transactions from file with validation
 */
export async function importTransactionsFromFile(
  filePath: string,
  onProgress?: (progress: { processed: number; total: number; errors: number }) => void
): Promise<{ success: number; errors: number; errorDetails: Array<{ row: number; message: string }> }> {
  // Read file
  const fileResult = await readImportFile(filePath);

  // Parse and validate based on format
  let validationResult: ImportValidationResult;
  if (fileResult.format === 'json') {
    // Check if encrypted
    try {
      const wrapper = JSON.parse(fileResult.contents);
      if (wrapper.encrypted) {
        // Decrypt first
        const decrypted = await decryptEncryptedJson(filePath);
        validationResult = parseAndValidateJson(decrypted);
      } else {
        validationResult = parseAndValidateJson(fileResult.contents);
      }
    } catch {
      // Not encrypted, parse as regular JSON
      validationResult = parseAndValidateJson(fileResult.contents);
    }
  } else {
    validationResult = parseAndValidateCsv(fileResult.contents);
  }

  // Report progress
  if (onProgress) {
    onProgress({
      processed: validationResult.valid.length + validationResult.errors.length,
      total: validationResult.valid.length + validationResult.errors.length,
      errors: validationResult.errors.length
    });
  }

  // Import valid transactions
  if (validationResult.valid.length > 0) {
    try {
      await importTransactions(validationResult.valid);
    } catch (error) {
      return {
        success: 0,
        errors: validationResult.errors.length + validationResult.valid.length,
        errorDetails: [
          ...validationResult.errors,
          ...validationResult.valid.map((_, index) => ({
            row: validationResult.errors.length + index + 1,
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }))
        ]
      };
    }
  }

  return {
    success: validationResult.valid.length,
    errors: validationResult.errors.length,
    errorDetails: validationResult.errors
  };
}
