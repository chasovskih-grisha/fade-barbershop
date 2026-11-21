'use client';

import ReferralFilters from './ReferralFilters';
import ReferralTable from './ReferralTable';
import type { ReferralFilter, ReferralItem } from './referral-model';

export default function ReferralListCard({
  items,
  filter,
  query,
  onFilter,
  onQuery,
  onRevoke,
}: {
  items: ReferralItem[];
  filter: ReferralFilter;
  query: string;
  onFilter: (filter: ReferralFilter) => void;
  onQuery: (query: string) => void;
  onRevoke: (item: ReferralItem) => void;
}) {
  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-h2 font-semibold text-fg">
            Список рефералів та анти-аб&apos;юз огляд (RFR-ADM-02/03)
          </h2>
          <p className="text-body-sm text-fg-secondary">
            Фільтрація підозрілих патернів (спільні телефони, пристрої, серії no-show) та ручне
            анулювання з логом.
          </p>
        </div>
        <ReferralFilters filter={filter} query={query} onFilter={onFilter} onQuery={onQuery} />
      </div>
      <ReferralTable items={items} onRevoke={onRevoke} />
    </div>
  );
}
