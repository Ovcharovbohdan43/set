import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { formatInputAmount, parseInputAmount } from '../utils/money';
const TRANSACTION_TYPES = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'transfer', label: 'Transfer' }
];
const PRESET_CURRENCIES = [
    { value: 'USD', label: 'USD · US Dollar' },
    { value: 'EUR', label: 'EUR · Euro' },
    { value: 'GBP', label: 'GBP · British Pound' }
];
export function TransactionFormView({ accounts, categories, defaultValues, onSubmit, onCancel, submitLabel = 'Save' }) {
    const initialAccount = useMemo(() => {
        if (defaultValues?.accountId)
            return defaultValues.accountId;
        return accounts[0]?.id ?? '';
    }, [accounts, defaultValues?.accountId]);
    const [form, setForm] = useState(() => ({
        id: defaultValues?.id,
        accountId: initialAccount,
        categoryId: defaultValues?.categoryId ?? null,
        type: defaultValues?.type ?? 'expense',
        amountCents: defaultValues?.amountCents ?? 0,
        currency: defaultValues?.currency ?? 'USD',
        occurredOn: defaultValues?.occurredOn ??
            new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
        notes: defaultValues?.notes ?? '',
        tags: defaultValues?.tags ?? [],
        cleared: defaultValues?.cleared ?? false,
        goalId: defaultValues?.goalId ?? null
    }));
    const [amountInput, setAmountInput] = useState(() => formatInputAmount(form.amountCents));
    const [tagsInput, setTagsInput] = useState(() => (form.tags ?? []).join(', '));
    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleSubmit = (event) => {
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
    return (_jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Account", _jsx("select", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: form.accountId, onChange: (event) => handleChange('accountId', event.target.value), children: accounts.map((account) => (_jsx("option", { value: account.id, children: account.name }, account.id))) })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Category", _jsxs("select", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: form.categoryId ?? '', onChange: (event) => {
                                    const value = event.target.value || null;
                                    handleChange('categoryId', value);
                                }, children: [_jsx("option", { value: "", children: "Uncategorized" }), categories.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [_jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Type", _jsx("select", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: form.type, onChange: (event) => handleChange('type', event.target.value), children: TRANSACTION_TYPES.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Amount", _jsx("input", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", type: "number", step: "0.01", inputMode: "decimal", value: amountInput, onChange: (event) => setAmountInput(event.target.value) })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Currency", _jsx("input", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm uppercase dark:border-slate-700 dark:bg-slate-900", value: form.currency, maxLength: 3, onChange: (event) => handleChange('currency', event.target.value.toUpperCase()) })] })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Date", _jsx("input", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", type: "date", value: form.occurredOn.slice(0, 10), onChange: (event) => handleChange('occurredOn', new Date(event.target.value).toISOString()) })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Notes", _jsx("textarea", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", value: form.notes ?? '', rows: 3, onChange: (event) => handleChange('notes', event.target.value) })] }), _jsxs("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Tags", _jsx("input", { className: "mt-1 w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900", placeholder: "Comma separated", value: tagsInput, onChange: (event) => setTagsInput(event.target.value) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300", children: [_jsx("input", { type: "checkbox", checked: form.cleared ?? false, onChange: (event) => handleChange('cleared', event.target.checked) }), "Cleared"] }), _jsxs("div", { className: "space-x-2", children: [onCancel ? (_jsx("button", { type: "button", className: "rounded-lg border border-slate-300/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", onClick: onCancel, children: "Cancel" })) : null, _jsx("button", { type: "submit", className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", children: submitLabel })] })] })] }));
}
