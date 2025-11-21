import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AppearanceSection } from './sections/AppearanceSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { DataSection } from './sections/DataSection';
import { GeneralSection } from './sections/GeneralSection';
import { PersonalizationSection } from './sections/PersonalizationSection';
const SECTIONS = [
    { id: 'general', label: 'General' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'categories', label: 'Categories' },
    { id: 'sync', label: 'Sync' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'data', label: 'Data' },
    { id: 'personalization', label: 'Personalization' },
    { id: 'appearance', label: 'Appearance' }
];
export function SettingsPage() {
    const [activeSection, setActiveSection] = useState('general');
    const renderSection = () => {
        switch (activeSection) {
            case 'general':
                return _jsx(GeneralSection, {});
            case 'categories':
                return _jsx(CategoriesSection, {});
            case 'data':
                return _jsx(DataSection, {});
            case 'personalization':
                return _jsx(PersonalizationSection, {});
            case 'appearance':
                return _jsx(AppearanceSection, {});
            case 'accounts':
                return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400", children: "Account management coming soon..." }));
            case 'sync':
                return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400", children: "Sync settings coming in Stage 9..." }));
            case 'notifications':
                return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400", children: "Notification preferences coming soon..." }));
            default:
                return null;
        }
    };
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("p", { className: "text-sm uppercase tracking-wide text-slate-500", children: "Settings" }), _jsx("h2", { className: "text-2xl font-semibold text-slate-900 dark:text-white", children: "Application Settings" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Manage your preferences, accounts, categories, and data" })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[250px_1fr]", children: [_jsx("nav", { className: "space-y-1 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800", children: SECTIONS.map((section) => (_jsx("button", { type: "button", onClick: () => setActiveSection(section.id), className: `w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${activeSection === section.id
                                ? 'bg-primary text-white'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`, children: section.label }, section.id))) }), _jsx("div", { className: "min-h-[400px] rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800", children: renderSection() })] })] }));
}
