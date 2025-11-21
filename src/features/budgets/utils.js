export function getBudgetStatusColor(status) {
    switch (status) {
        case 'normal':
            return 'text-green-600 dark:text-green-400';
        case 'atRisk':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'over':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-slate-600 dark:text-slate-400';
    }
}
export function getBudgetStatusBgColor(status) {
    switch (status) {
        case 'normal':
            return 'bg-green-50 dark:bg-green-900/20';
        case 'atRisk':
            return 'bg-yellow-50 dark:bg-yellow-900/20';
        case 'over':
            return 'bg-red-50 dark:bg-red-900/20';
        default:
            return 'bg-slate-50 dark:bg-slate-800';
    }
}
export function getBudgetStatusRingColor(status) {
    switch (status) {
        case 'normal':
            return 'stroke-green-500';
        case 'atRisk':
            return 'stroke-yellow-500';
        case 'over':
            return 'stroke-red-500';
        default:
            return 'stroke-slate-400';
    }
}
export function calculateProgressPercent(spent, total) {
    if (total <= 0)
        return 0;
    return Math.min(100, Math.round((spent / total) * 100));
}
