/**
 * Format currency amount from cents to display string
 */
export function formatCurrency(cents, currency = 'USD') {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
}
/**
 * Format percentage for display
 */
export function formatPercent(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}
/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}
/**
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonth(month) {
    const parts = month.split('-');
    if (parts.length !== 2) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const year = Number(parts[0]);
    const monthNum = Number(parts[1]);
    if (isNaN(year) || isNaN(monthNum)) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const date = new Date(year, monthNum - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
}
/**
 * Get next month in YYYY-MM format
 */
export function getNextMonth(month) {
    const parts = month.split('-');
    if (parts.length !== 2) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const year = Number(parts[0]);
    const monthNum = Number(parts[1]);
    if (isNaN(year) || isNaN(monthNum)) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const date = new Date(year, monthNum - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
}
/**
 * Format month string for display (e.g., "2025-01" -> "January 2025")
 */
export function formatMonth(month) {
    const parts = month.split('-');
    if (parts.length !== 2) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const year = Number(parts[0]);
    const monthNum = Number(parts[1]);
    if (isNaN(year) || isNaN(monthNum)) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
/**
 * Get date range for a month (start and end dates)
 */
export function getMonthDateRange(month) {
    const parts = month.split('-');
    if (parts.length !== 2) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const year = Number(parts[0]);
    const monthNum = Number(parts[1]);
    if (isNaN(year) || isNaN(monthNum)) {
        throw new Error(`Invalid month format: ${month}`);
    }
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
}
/**
 * Get top N categories by spending
 */
export function getTopCategories(categories, limit = 10) {
    return [...categories]
        .sort((a, b) => b.amountCents - a.amountCents)
        .slice(0, limit);
}
/**
 * Get "Other" category aggregate for categories beyond limit
 */
export function getOtherCategory(categories, limit = 10) {
    const topCategories = getTopCategories(categories, limit);
    const otherCategories = categories.slice(limit);
    if (otherCategories.length === 0) {
        return null;
    }
    const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amountCents, 0);
    const totalAmount = categories.reduce((sum, cat) => sum + cat.amountCents, 0);
    const otherPercentage = totalAmount > 0 ? (otherAmount / totalAmount) * 100 : 0;
    return {
        categoryId: null,
        categoryName: 'Other',
        amountCents: otherAmount,
        percentage: otherPercentage
    };
}
