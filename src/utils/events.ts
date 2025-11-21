export const AppEvents = {
  transactionsChanged: 'transaction:changed'
} as const;

export function emitAppEvent(name: string, detail?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

