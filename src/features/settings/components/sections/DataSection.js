import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { parseAndValidateCsv, parseAndValidateJson } from '../../api';
import { importTransactions } from '@/features/transactions/api';
export function DataSection() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [importSuccess, setImportSuccess] = useState(null);
    const queryClient = useQueryClient();
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setIsImporting(true);
        setImportProgress(null);
        setImportErrors([]);
        setImportSuccess(null);
        try {
            // Read file as text (since we can't access file path directly in browser)
            const fileContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve(event.target?.result);
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
            const fileName = file.name;
            const isJson = fileName.endsWith('.json');
            const isCsv = fileName.endsWith('.csv');
            if (!isJson && !isCsv) {
                throw new Error('Unsupported file format. Only CSV and JSON are supported.');
            }
            // Parse and validate based on format
            let validationResult;
            if (isJson) {
                // Check if encrypted JSON
                try {
                    const wrapper = JSON.parse(fileContent);
                    if (wrapper.encrypted) {
                        // For encrypted JSON, we need file path from Tauri dialog
                        // For now, show error message
                        setImportErrors([
                            {
                                row: 0,
                                message: 'Encrypted JSON import requires file path access. Please use Tauri file dialog (planned for future enhancement).'
                            }
                        ]);
                        return;
                    }
                    else {
                        validationResult = parseAndValidateJson(fileContent);
                    }
                }
                catch {
                    validationResult = parseAndValidateJson(fileContent);
                }
            }
            else {
                validationResult = parseAndValidateCsv(fileContent);
            }
            // Report progress
            setImportProgress({
                processed: validationResult.valid.length + validationResult.errors.length,
                total: validationResult.valid.length + validationResult.errors.length,
                errors: validationResult.errors.length
            });
            // Import valid transactions
            if (validationResult.valid.length > 0) {
                try {
                    await importTransactions(validationResult.valid);
                    setImportSuccess(validationResult.valid.length);
                    setImportErrors(validationResult.errors);
                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    queryClient.invalidateQueries({ queryKey: ['reports'] });
                }
                catch (error) {
                    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            else {
                setImportSuccess(0);
                setImportErrors(validationResult.errors);
            }
        }
        catch (error) {
            console.error('Import failed', error);
            setImportErrors([
                {
                    row: 0,
                    message: error instanceof Error ? error.message : 'Unknown error occurred'
                }
            ]);
        }
        finally {
            setIsImporting(false);
            // Reset file input
            e.target.value = '';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Data Management" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Export your data or import from a backup" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "Export Data" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Export your transactions, accounts, budgets, and goals to CSV or encrypted JSON. Use the Export button on the Reports page for full report exports." }), _jsx("p", { className: "mt-2 text-xs text-slate-500 dark:text-slate-400", children: "Export functionality is available on the Reports page." })] }), _jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "Import Data" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Import transactions from CSV or JSON files. Files are validated before import using Zod schemas. Encrypted JSON import requires file path access (planned for future enhancement)." }), _jsxs("div", { className: "mt-3 space-y-2", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "sr-only", children: "Choose import file" }), _jsx("input", { type: "file", accept: ".csv,.json", onChange: handleFileSelect, disabled: isImporting, className: "block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary/90 disabled:opacity-50 dark:text-slate-300" })] }), isImporting && importProgress && (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-600 dark:text-slate-400", children: [_jsxs("span", { children: ["Processing ", importProgress.processed, " of ", importProgress.total, "..."] }), _jsxs("span", { children: [importProgress.errors, " errors"] })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700", children: _jsx("div", { className: "h-full bg-primary transition-all", style: {
                                                        width: `${(importProgress.processed / importProgress.total) * 100}%`
                                                    } }) })] })), importSuccess !== null && (_jsxs("div", { className: "rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300", children: ["Successfully imported ", importSuccess, " transaction", importSuccess !== 1 ? 's' : '', importErrors.length > 0 &&
                                                ` with ${importErrors.length} error${importErrors.length !== 1 ? 's' : ''}`] })), importErrors.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-xs font-medium text-red-600 dark:text-red-400", children: ["Import Errors (", importErrors.length, "):"] }), _jsxs("div", { className: "max-h-32 space-y-1 overflow-y-auto rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300", children: [importErrors.slice(0, 10).map((error, index) => (_jsxs("div", { children: ["Row ", error.row, ": ", error.message] }, index))), importErrors.length > 10 && (_jsxs("div", { children: ["... and ", importErrors.length - 10, " more errors"] }))] })] }))] }), _jsxs("div", { className: "mt-3 text-xs text-slate-500 dark:text-slate-400", children: [_jsx("p", { className: "font-semibold", children: "CSV Format:" }), _jsx("p", { className: "mt-1 font-mono", children: "date,account,category,type,amount,currency,notes" }), _jsx("p", { className: "mt-2", children: "Example: 2025-01-20,checking-account,groceries,expense,50.00,USD,Bought food" }), _jsx("p", { className: "mt-3 font-semibold", children: "JSON Format:" }), _jsx("p", { className: "mt-1 font-mono", children: `{"transactions": [{"accountId": "...", ...}]}` })] })] })] })] }));
}
