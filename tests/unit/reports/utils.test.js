import { describe, expect, it } from 'vitest';
import { formatCurrency, formatMonth, formatPercent, getCurrentMonth, getMonthDateRange, getNextMonth, getOtherCategory, getPreviousMonth, getTopCategories } from '@/features/reports/utils';
describe('reports/utils', () => {
    describe('formatCurrency', () => {
        it('should format cents to currency string', () => {
            expect(formatCurrency(12345, 'USD')).toBe('$123.45');
            expect(formatCurrency(0, 'USD')).toBe('$0.00');
            expect(formatCurrency(-5000, 'USD')).toBe('-$50.00');
        });
        it('should use USD as default currency', () => {
            expect(formatCurrency(10000)).toBe('$100.00');
        });
    });
    describe('formatPercent', () => {
        it('should format percentage with default decimals', () => {
            expect(formatPercent(50.123)).toBe('50.1%');
            expect(formatPercent(100)).toBe('100.0%');
        });
        it('should format percentage with custom decimals', () => {
            expect(formatPercent(50.123, 2)).toBe('50.12%');
            expect(formatPercent(50.123, 0)).toBe('50%');
        });
    });
    describe('getCurrentMonth', () => {
        it('should return current month in YYYY-MM format', () => {
            const month = getCurrentMonth();
            expect(month).toMatch(/^\d{4}-\d{2}$/);
            const [year, monthNum] = month.split('-').map(Number);
            expect(year).toBeGreaterThan(2020);
            expect(monthNum).toBeGreaterThanOrEqual(1);
            expect(monthNum).toBeLessThanOrEqual(12);
        });
    });
    describe('getPreviousMonth', () => {
        it('should return previous month', () => {
            expect(getPreviousMonth('2025-01')).toBe('2024-12');
            expect(getPreviousMonth('2025-03')).toBe('2025-02');
            expect(getPreviousMonth('2024-12')).toBe('2024-11');
        });
    });
    describe('getNextMonth', () => {
        it('should return next month', () => {
            expect(getNextMonth('2024-12')).toBe('2025-01');
            expect(getNextMonth('2025-01')).toBe('2025-02');
            expect(getNextMonth('2025-11')).toBe('2025-12');
        });
    });
    describe('formatMonth', () => {
        it('should format month string for display', () => {
            expect(formatMonth('2025-01')).toContain('January');
            expect(formatMonth('2025-01')).toContain('2025');
            expect(formatMonth('2025-12')).toContain('December');
        });
    });
    describe('getMonthDateRange', () => {
        it('should return start and end dates for a month', () => {
            const range = getMonthDateRange('2025-01');
            expect(range.startDate).toBe('2025-01-01');
            expect(range.endDate).toBe('2025-01-31');
            const rangeFeb = getMonthDateRange('2025-02');
            expect(rangeFeb.startDate).toBe('2025-02-01');
            expect(rangeFeb.endDate).toBe('2025-02-28'); // Non-leap year
        });
    });
    describe('getTopCategories', () => {
        it('should return top N categories sorted by amount', () => {
            const categories = [
                { categoryId: '1', categoryName: 'A', amountCents: 100, percentage: 10 },
                { categoryId: '2', categoryName: 'B', amountCents: 300, percentage: 30 },
                { categoryId: '3', categoryName: 'C', amountCents: 200, percentage: 20 },
                { categoryId: '4', categoryName: 'D', amountCents: 400, percentage: 40 }
            ];
            const top2 = getTopCategories(categories, 2);
            expect(top2).toHaveLength(2);
            expect(top2[0]?.categoryName).toBe('D');
            expect(top2[1]?.categoryName).toBe('B');
        });
        it('should return all categories if limit is greater than array length', () => {
            const categories = [
                { categoryId: '1', categoryName: 'A', amountCents: 100, percentage: 10 }
            ];
            const top10 = getTopCategories(categories, 10);
            expect(top10).toHaveLength(1);
        });
    });
    describe('getOtherCategory', () => {
        it('should return null if no categories beyond limit', () => {
            const categories = [
                { categoryId: '1', categoryName: 'A', amountCents: 100, percentage: 10 }
            ];
            expect(getOtherCategory(categories, 10)).toBeNull();
        });
        it('should aggregate categories beyond limit', () => {
            const categories = [
                { categoryId: '1', categoryName: 'A', amountCents: 100, percentage: 10 },
                { categoryId: '2', categoryName: 'B', amountCents: 200, percentage: 20 },
                { categoryId: '3', categoryName: 'C', amountCents: 300, percentage: 30 },
                { categoryId: '4', categoryName: 'D', amountCents: 400, percentage: 40 }
            ];
            const other = getOtherCategory(categories, 2);
            expect(other).not.toBeNull();
            expect(other?.categoryName).toBe('Other');
            expect(other?.amountCents).toBe(300); // C + D (beyond top 2)
            expect(other?.categoryId).toBeNull();
        });
    });
});
