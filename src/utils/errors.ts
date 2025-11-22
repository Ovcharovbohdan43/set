/**
 * Utility functions for error handling and user-friendly error messages
 */

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's a Zod validation error
    if (error.name === 'ZodError' || error.message.includes('ZodError')) {
      return getZodErrorMessage(error);
    }
    
    // Check if it's a database error
    if (error.message.includes('database error')) {
      const match = error.message.match(/database error:\s*(.+)/i);
      if (match && match[1]) {
        return translateErrorMessage(match[1]);
      }
    }
    return translateErrorMessage(error.message);
  }
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }
  return 'An unknown error occurred. Please try again.';
}

/**
 * Extracts user-friendly message from Zod validation errors
 */
function getZodErrorMessage(error: Error): string {
  // Try to extract Zod error details from message
  const message = error.message;
  
  if (message.includes('Required')) {
    return 'Please fill in all required fields.';
  }
  if (message.includes('Expected number')) {
    return 'Please enter a valid number.';
  }
  if (message.includes('Expected string')) {
    return 'Please enter a valid text value.';
  }
  if (message.includes('Too small')) {
    return 'Value is too small. Please enter a larger value.';
  }
  if (message.includes('Too big')) {
    return 'Value is too large. Please enter a smaller value.';
  }
  if (message.includes('Invalid')) {
    return 'Invalid value. Please check your input.';
  }
  
  // Default Zod error message
  return 'Validation error. Please check your input.';
}

/**
 * Translates common error messages to user-friendly English text
 */
function translateErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Database errors
  if (lowerMessage.includes('no such table')) {
    const tableMatch = message.match(/no such table:\s*(\w+)/i);
    if (tableMatch) {
      return `Table "${tableMatch[1]}" not found. Please restart the application.`;
    }
    return 'Database error: table not found. Please restart the application.';
  }
  if (lowerMessage.includes('database error') || lowerMessage.includes('database')) {
    return 'Database error. Please check your data and try again.';
  }
  if (lowerMessage.includes('constraint') || lowerMessage.includes('foreign key')) {
    return 'Error saving data. Please check related records.';
  }

  // Network/connection errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Validation error. Please check your input.';
  }
  if (lowerMessage.includes('required')) {
    return 'Please fill in all required fields.';
  }

  // Permission errors
  if (lowerMessage.includes('permission') || lowerMessage.includes('access denied')) {
    return 'Insufficient permissions. Please check application settings.';
  }

  // Common patterns
  if (lowerMessage.includes('not found')) {
    return 'Record not found.';
  }
  if (lowerMessage.includes('already exists')) {
    return 'A record with this data already exists.';
  }

  // Planning-specific errors
  if (lowerMessage.includes('plan') && lowerMessage.includes('not found')) {
    return 'Plan not found. Please create a new plan.';
  }
  if (lowerMessage.includes('monthly plan') && lowerMessage.includes('not found')) {
    return 'Plan not found. Please select an existing plan or create a new one.';
  }

  // If no translation found, return original message or generic error
  if (message.trim()) {
    return message;
  }

  return 'An unknown error occurred. Please try again.';
}

/**
 * Gets a user-friendly title for error notifications
 */
export function getErrorTitle(error: unknown, context?: string): string {
  if (context) {
    return `Error ${context}`;
  }
  return 'Error';
}

/**
 * Common error contexts in English
 */
export const ErrorContexts = {
  createPlan: 'creating plan',
  updatePlan: 'updating plan',
  deletePlan: 'deleting plan',
  createIncome: 'adding income',
  updateIncome: 'updating income',
  deleteIncome: 'deleting income',
  createExpense: 'adding expense',
  updateExpense: 'updating expense',
  deleteExpense: 'deleting expense',
  createSaving: 'adding savings',
  updateSaving: 'updating savings',
  deleteSaving: 'deleting savings',
  createDebt: 'adding debt',
  updateDebt: 'updating debt',
  deleteDebt: 'deleting debt',
  loadData: 'loading data',
  saveData: 'saving data',
} as const;

