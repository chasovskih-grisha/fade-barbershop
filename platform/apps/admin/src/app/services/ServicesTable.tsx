'use client';

// Каталог послуг і цін за локаціями. UI-кіт Table: однакові відступи,
// hover-рядки, розділювачі — як на решті екранів. Фільтр статусу й сортування
// по назві/тривалості/статусу — клієнтські, по завантаженому каталозі.
import { useState } from 'react';
import { EmptyState, Table, TBody, TH, THead, TR } from '@fade/ui';
import { SortableTh } from '../components/SortableTh';
import { FilterSelect } from '../components/FilterSelect';
import { useColumnSort, sortRows } from '../components/use-column-sort';
import { patchPrice, patchService } from './services-api';
import { ServiceRow } from './ServiceRow';
import type { CatalogService, ServiceLocation } from './service-types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
];

const SORT_VALUE: Record<string, (service: CatalogService) => unknown> = {
  name: (service) => service.name,
  duration: (service) => service.duration,
  status: (service) => (service.active ? 0 : 1),
};

export function ServicesTable({
  services,
  locations,
  onError,
  onReload,
  onSaved,
}: {
  services: CatalogService[];
  locations: ServiceLocation[];
  onError: (message: string) => void;
  onReload: () => Promise<void>;
  onSaved: () => void;
}) {
  const { sort, onSort } = useColumnSort({ key: 'name', dir: 'asc' });
  const [status, setStatus] = useState('all');

  const update = async (service: CatalogService, changes: Partial<CatalogService>) => {
    if (await patchService(service.id, changes, onError)) {
      await onReload();
      onSaved();
    }
  };
  const price = async (input: {
    serviceId: string;
    locationId: string;
    amount: number;
    active: boolean;
  }) => {
    if (await patchPrice(input, onError)) {
      await onReload();
      onSaved();
    }
  };

  if (services.length === 0) {
    return (
      <EmptyState
        title="Послуг ще немає"
        description="Додайте першу послугу формою вище — вона з’явиться в каталозі."
      />
    );
  }

  const filtered = services.filter(
    (service) => status === 'all' || (status === 'active') === service.active
  );
  const rows = sortRows(filtered, sort, (service) => SORT_VALUE[sort.key]?.(service));

  return (
    <>
      <div className="mt-4 flex items-end justify-between gap-3">
        <FilterSelect label="Статус" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <p className="text-body text-fg-secondary">Показано: {rows.length}</p>
      </div>
      <div className="mt-2 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <SortableTh column="name" label="Послуга" sort={sort} onSort={onSort} />
              <SortableTh column="duration" label="Тривалість" sort={sort} onSort={onSort} />
              {locations.map((location) => (
                <TH key={location.id}>{location.name}</TH>
              ))}
              <SortableTh column="status" label="Статус" sort={sort} onSort={onSort} />
            </TR>
          </THead>
          <TBody>
            {rows.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                locations={locations}
                onUpdate={update}
                onPrice={price}
              />
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
