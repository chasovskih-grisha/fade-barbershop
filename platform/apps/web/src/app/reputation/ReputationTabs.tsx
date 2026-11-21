import type { ReputationTab } from './reputation-data';

const TABS: Array<{ id: ReputationTab; label: string }> = [
  { id: 'benchmarks', label: '🏙️ Порівняння по районах' },
  { id: 'reviews', label: '💬 Відгуки гостей (4.4k+)' },
  { id: 'competitive', label: '📊 Ринковий Бенчмаркінг' },
  { id: 'topics', label: '🎯 Тематичний аналіз & Тональність' },
];

interface ReputationTabsProps {
  activeTab: ReputationTab;
  onTab: (tab: ReputationTab) => void;
  onWriteReview: () => void;
}

export function ReputationTabs({ activeTab, onTab, onWriteReview }: ReputationTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTab(tab.id)}
          className={`px-5 py-2.5 rounded-pill text-body font-semibold transition-all ${
            activeTab === tab.id
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
          }`}
        >
          {tab.label}
        </button>
      ))}
      <div className="ml-auto">
        <button
          type="button"
          onClick={onWriteReview}
          className="inline-flex h-11 items-center justify-center rounded-input bg-accent-blue text-white px-6 text-body font-semibold shadow-lg hover:opacity-95 transition-all"
        >
          + Залишити відгук
        </button>
      </div>
    </div>
  );
}
