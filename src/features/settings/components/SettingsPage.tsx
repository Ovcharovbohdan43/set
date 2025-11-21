import { useState } from 'react';

import { AppearanceSection } from './sections/AppearanceSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { DataSection } from './sections/DataSection';
import { GeneralSection } from './sections/GeneralSection';
import { PersonalizationSection } from './sections/PersonalizationSection';

type SectionId =
  | 'general'
  | 'accounts'
  | 'categories'
  | 'sync'
  | 'notifications'
  | 'data'
  | 'appearance'
  | 'personalization';

interface Section {
  id: SectionId;
  label: string;
  icon?: string;
}

const SECTIONS: Section[] = [
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
  const [activeSection, setActiveSection] = useState<SectionId>('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection />;
      case 'categories':
        return <CategoriesSection />;
      case 'data':
        return <DataSection />;
      case 'personalization':
        return <PersonalizationSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'accounts':
        return (
          <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            Account management coming soon...
          </div>
        );
      case 'sync':
        return (
          <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            Sync settings coming in Stage 9...
          </div>
        );
      case 'notifications':
        return (
          <div className="rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            Notification preferences coming soon...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-500">Settings</p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Application Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your preferences, accounts, categories, and data
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                activeSection === section.id
                  ? 'bg-primary text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          {renderSection()}
        </div>
      </div>
    </section>
  );
}

