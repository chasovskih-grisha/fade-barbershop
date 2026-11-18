'use client';

// Комірка «тривалість»: послідовна й паралельна. Збереження по blur лише при
// зміні значення. Попередження видно до збереження: зміна тривалості стосується
// лише нових записів — чинні візити тримають зафіксовану тривалість (T-4618b).
import { useState } from 'react';
import { TD } from '@fade/ui';
import type { CatalogService } from './service-types';

const INPUT =
  'rounded-input border border-line bg-surface-sunken px-2 py-1.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

const WARNING = 'Зміна застосується лише до нових записів: чинні візити збережуть свою тривалість.';

export function ServiceDurationCell({
  service,
  onUpdate,
}: {
  service: CatalogService;
  onUpdate: (service: CatalogService, changes: Partial<CatalogService>) => void;
}) {
  const [duration, setDuration] = useState(service.duration);
  const [parallel, setParallel] = useState<number | null>(service.parallelDuration);
  const dirty = duration !== service.duration || parallel !== service.parallelDuration;

  return (
    <TD>
      <label className="flex items-center gap-1.5 text-body text-fg-secondary">
        Послідовно
        <input
          aria-label={`${service.name}: тривалість`}
          type="number"
          min={5}
          max={480}
          value={duration}
          className={`w-20 ${INPUT}`}
          onChange={(e) => setDuration(Number(e.target.value))}
          onBlur={() => duration !== service.duration && void onUpdate(service, { duration })}
        />
        хв
      </label>
      <label className="mt-1.5 flex items-center gap-1.5 text-body text-fg-secondary">
        Паралельно
        <input
          aria-label={`${service.name}: паралельна тривалість`}
          type="number"
          min={5}
          max={480}
          value={parallel ?? ''}
          className={`w-20 ${INPUT}`}
          onChange={(e) => setParallel(e.target.value === '' ? null : Number(e.target.value))}
          onBlur={() =>
            parallel !== service.parallelDuration &&
            void onUpdate(service, { parallelDuration: parallel })
          }
        />
        хв
      </label>
      {dirty && (
        <p className="mt-1.5 text-caption text-fg-muted" role="status">
          {WARNING}
        </p>
      )}
    </TD>
  );
}
