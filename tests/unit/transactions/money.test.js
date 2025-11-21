import { describe, expect, it } from 'vitest';
import { formatCurrency, formatInputAmount, parseInputAmount } from '@/features/transactions/utils/money';
describe('money utils', () => {
    it('formats cents into currency string', () => {
        const formatted = formatCurrency(12345, 'USD');
        expect(formatted).toMatch(/\$123\.45/);
    });
    it('formats cents into input string', () => {
        expect(formatInputAmount(501)).toBe('5.01');
    });
    it('parses decimal input into cents', () => {
        expect(parseInputAmount('19.99')).toBe(1999);
        expect(parseInputAmount('abc')).toBe(0);
    });
});
