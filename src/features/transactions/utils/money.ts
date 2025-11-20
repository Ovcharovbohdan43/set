const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string) {
  const key = currency.toUpperCase();
  if (!CURRENCY_FORMATTERS.has(key)) {
    CURRENCY_FORMATTERS.set(
      key,
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: key,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }
  return CURRENCY_FORMATTERS.get(key)!;
}

export function formatCurrency(amountCents: number, currency: string) {
  const formatter = getFormatter(currency);
  return formatter.format(amountCents / 100);
}

export function formatInputAmount(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

export function parseInputAmount(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}

