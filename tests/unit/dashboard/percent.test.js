import { describe, expect, it } from 'vitest';
import { calculatePercent } from '@/features/dashboard/utils';
describe('calculatePercent', () => {
    it('returns zero when total is zero', () => {
        expect(calculatePercent(100, 0)).toBe(0);
    });
    it('clamps to 100 when part exceeds total', () => {
        expect(calculatePercent(150, 100)).toBe(100);
    });
    it('calculates rounded percent', () => {
        expect(calculatePercent(45, 200)).toBe(23);
    });
});
