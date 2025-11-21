import { describe, expect, it } from 'vitest';

import { parseAndValidateCsv, parseAndValidateJson } from '@/features/settings/api';

describe('parseAndValidateCsv', () => {
  it('should parse valid CSV with all required fields', () => {
    const csv = `date,account,category,type,amount,currency,notes
2025-01-20,account-1,category-1,expense,50.00,USD,Groceries`;

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);
    expect(result.valid[0]?.accountId).toBe('account-1');
    expect(result.valid[0]?.type).toBe('expense');
    expect(result.valid[0]?.amountCents).toBe(5000);
  });

  it('should handle missing required fields', () => {
    const csv = `date,account,category,type,amount,currency,notes
2025-01-20,,category-1,expense,50.00,USD,Groceries`;

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle invalid amount', () => {
    const csv = `date,account,category,type,amount,currency,notes
2025-01-20,account-1,category-1,expense,invalid,USD,Groceries`;

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle empty CSV', () => {
    const csv = '';

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('must contain at least');
  });

  it('should handle CSV with only header', () => {
    const csv = `date,account,category,type,amount,currency,notes`;

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle invalid transaction type', () => {
    const csv = `date,account,category,type,amount,currency,notes
2025-01-20,account-1,category-1,invalid,50.00,USD,Groceries`;

    const result = parseAndValidateCsv(csv);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseAndValidateJson', () => {
  it('should parse valid JSON transactions array', () => {
    const json = JSON.stringify({
      transactions: [
        {
          accountId: 'account-1',
          categoryId: 'category-1',
          type: 'expense',
          amountCents: 5000,
          currency: 'USD',
          occurredOn: '2025-01-20T00:00:00Z',
          notes: 'Groceries'
        }
      ]
    });

    const result = parseAndValidateJson(json);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);
    expect(result.valid[0]?.accountId).toBe('account-1');
  });

  it('should parse JSON array format', () => {
    const json = JSON.stringify([
      {
        accountId: 'account-1',
        type: 'expense',
        amountCents: 5000,
        currency: 'USD',
        occurredOn: '2025-01-20T00:00:00Z'
      }
    ]);

    const result = parseAndValidateJson(json);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  it('should handle invalid JSON', () => {
    const json = 'invalid json';

    const result = parseAndValidateJson(json);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('Failed to parse JSON');
  });

  it('should handle missing transactions array', () => {
    const json = JSON.stringify({});

    const result = parseAndValidateJson(json);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('must contain a transactions array');
  });

  it('should validate each transaction with Zod', () => {
    const json = JSON.stringify({
      transactions: [
        {
          accountId: 'account-1',
          type: 'expense',
          amountCents: 5000,
          currency: 'USD',
          occurredOn: '2025-01-20T00:00:00Z'
        },
        {
          accountId: '',
          type: 'expense',
          amountCents: 5000,
          currency: 'USD',
          occurredOn: '2025-01-20T00:00:00Z'
        }
      ]
    });

    const result = parseAndValidateJson(json);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]?.message).toContain('Account is required');
  });
});

