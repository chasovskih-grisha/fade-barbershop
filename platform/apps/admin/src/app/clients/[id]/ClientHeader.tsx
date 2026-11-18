'use client';

// Заголовок картки клієнта: ім'я + телефон, дії праворуч (§6.2) і таби.
// Слот `actions` — той самий патерн, що в PageHeader: розкладка екранів
// передбачувана, а навігацію тримає сторінка, не презентаційний компонент.
import type { ReactNode } from 'react';
import type { ClientTab } from './client-types';

export function ClientHeader({
  name,
  phone,
  tabs,
  activeTab,
  onTabChange,
  actions,
}: {
  name: string | null;
  phone: string;
  tabs: { id: ClientTab; label: string }[];
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  actions?: ReactNode;
}) {
  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-h3">{name ?? 'Клієнт'}</h1>
          <p className="text-fg-secondary">{phone}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="flex gap-1 mb-4" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-input text-body font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-interactive text-fg'
                : 'text-fg-secondary hover:bg-interactive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
