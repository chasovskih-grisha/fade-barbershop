'use client';

// Комірки «послуга» і «тривалість»: назва/категорія/опис + послідовна й
// паралельна тривалість. Інпут-стилі єдині з рештою адмінки, збереження —
// по blur лише при зміні значення.
import { TD } from '@fade/ui';
import { ServiceDurationCell } from './ServiceDurationCell';
import type { CatalogService } from './service-types';

const INPUT =
  'rounded-input border border-line bg-surface-sunken px-2 py-1.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export function ServiceInfoCells({
  service,
  onUpdate,
}: {
  service: CatalogService;
  onUpdate: (service: CatalogService, changes: Partial<CatalogService>) => void;
}) {
  return (
    <>
      <TD>
        <div className="flex w-56 flex-col gap-1.5">
          <input
            aria-label={`${service.name}: назва`}
            defaultValue={service.name}
            className={INPUT}
            onBlur={(e) =>
              e.target.value !== service.name && void onUpdate(service, { name: e.target.value })
            }
          />
          <input
            aria-label={`${service.name}: категорія`}
            defaultValue={service.category ?? ''}
            placeholder="Категорія"
            className={`${INPUT} w-full`}
            onBlur={(e) =>
              e.target.value !== (service.category ?? '') &&
              void onUpdate(service, { category: e.target.value })
            }
          />
          <input
            aria-label={`${service.name}: опис`}
            defaultValue={service.description ?? ''}
            placeholder="Опис"
            className={`${INPUT} w-full`}
            onBlur={(e) =>
              e.target.value !== (service.description ?? '') &&
              void onUpdate(service, { description: e.target.value })
            }
          />
        </div>
      </TD>
      <ServiceDurationCell service={service} onUpdate={onUpdate} />
    </>
  );
}
