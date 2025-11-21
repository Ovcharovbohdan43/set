import { describe, expect, it } from 'vitest';
import { calculateProgressPercent, getBudgetStatusBgColor, getBudgetStatusColor, getBudgetStatusRingColor } from '@/features/budgets/utils';
describe('budgets utils', () => {
    describe('calculateProgressPercent', () => {
        it('should return 0 when total is 0', () => {
            expect(calculateProgressPercent(100, 0)).toBe(0);
        });
        it('should return 0 when total is negative', () => {
            expect(calculateProgressPercent(100, -100)).toBe(0);
        });
        it('should calculate correct percentage', () => {
            expect(calculateProgressPercent(50, 100)).toBe(50);
            expect(calculateProgressPercent(25, 100)).toBe(25);
            expect(calculateProgressPercent(100, 100)).toBe(100);
        });
        it('should cap at 100%', () => {
            expect(calculateProgressPercent(150, 100)).toBe(100);
        });
        it('should round to nearest integer', () => {
            expect(calculateProgressPercent(33, 100)).toBe(33);
            expect(calculateProgressPercent(66, 100)).toBe(66);
        });
    });
    describe('getBudgetStatusColor', () => {
        it('should return correct color for normal status', () => {
            expect(getBudgetStatusColor('normal')).toContain('green');
        });
        it('should return correct color for atRisk status', () => {
            expect(getBudgetStatusColor('atRisk')).toContain('yellow');
        });
        it('should return correct color for over status', () => {
            expect(getBudgetStatusColor('over')).toContain('red');
        });
    });
    describe('getBudgetStatusBgColor', () => {
        it('should return correct background color for normal status', () => {
            expect(getBudgetStatusBgColor('normal')).toContain('green');
        });
        it('should return correct background color for atRisk status', () => {
            expect(getBudgetStatusBgColor('atRisk')).toContain('yellow');
        });
        it('should return correct background color for over status', () => {
            expect(getBudgetStatusBgColor('over')).toContain('red');
        });
    });
    describe('getBudgetStatusRingColor', () => {
        it('should return correct ring color for normal status', () => {
            expect(getBudgetStatusRingColor('normal')).toContain('green');
        });
        it('should return correct ring color for atRisk status', () => {
            expect(getBudgetStatusRingColor('atRisk')).toContain('yellow');
        });
        it('should return correct ring color for over status', () => {
            expect(getBudgetStatusRingColor('over')).toContain('red');
        });
    });
});
