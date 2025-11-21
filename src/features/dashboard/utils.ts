export function calculatePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  if (part <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

