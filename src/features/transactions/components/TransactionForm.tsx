import { useMemo, useState } from 'react';

import type { Account, Category, TransactionForm } from '../schema';
import { formatInputAmount, parseInputAmount } from '../utils/money';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  defaultValues?: TransactionForm;
  onSubmit: (values: TransactionForm) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' }
] as const;

const PRESET_CURRENCIES = [
  { value: 'USD', label: 'USD · US Dollar' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'GBP', label: 'GBP · British Pound' }
] as const;

export function TransactionFormView({
  accounts,
  categories,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save'
}: TransactionFormProps) {
  const initialAccount = useMemo(() => {
    if (defaultValues?.accountId) return defaultValues.accountId;
    return accounts[0]?.id ?? '';
  }, [accounts, defaultValues?.accountId]);

  const [form, setForm] = useState<TransactionForm>(() => ({
    id: defaultValues?.id,
    accountId: initialAccount,
    categoryId: defaultValues?.categoryId ?? null,
    type: defaultValues?.type ?? 'expense',
    amountCents: defaultValues?.amountCents ?? 0,
    currency: defaultValues?.currency ?? 'USD',
    occurredOn:
      defaultValues?.occurredOn ??
      new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
    notes: defaultValues?.notes ?? '',
    tags: defaultValues?.tags ?? [],
    cleared: defaultValues?.cleared ?? false,
    goalId: defaultValues?.goalId ?? null
  }));
  const [amountInput, setAmountInput] = useState(() =>
    formatInputAmount(form.amountCents)
  );
  const [tagsInput, setTagsInput] = useState(() => (form.tags ?? []).join(', '));

  const handleChange = <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const amountCents = parseInputAmount(amountInput);
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      ...form,
      amountCents,
      currency: form.currency.toUpperCase(),
      tags
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Account
          <select
            className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.accountId}
            onChange={(event) => handleChange('accountId', event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Category
          <select
            className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.categoryId ?? ''}
            onChange={(event) => {
              const value = event.target.value || null;
              handleChange('categoryId', value);
            }}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Type
          <select
            className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.type}
            onChange={(event) =>
              handleChange('type', event.target.value as TransactionForm['type'])
            }
          >
            {TRANSACTION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Amount
          <input
            className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Currency
          <select
            className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.currency}
            onChange={(event) => handleChange('currency', event.target.value)}
          >
            {PRESET_CURRENCIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Date
        <input
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          type="date"
          value={form.occurredOn.slice(0, 10)}
          onChange={(event) =>
            handleChange('occurredOn', new Date(event.target.value).toISOString())
          }
        />
      </label>

      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={form.notes ?? ''}
          rows={3}
          onChange={(event) => handleChange('notes', event.target.value)}
        />
      </label>

      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Tags
        <input
          className="mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          placeholder="Comma separated"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
        />
      </label>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.cleared ?? false}
            onChange={(event) => handleChange('cleared', event.target.checked)}
          />
          Cleared
        </label>

        <div className="space-x-2">
          {onCancel ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

