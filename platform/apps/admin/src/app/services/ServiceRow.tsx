'use client';

// Рядок послуги: назва/категорія/опис + тривалості, ціни за локаціями
// (збереження по blur), статус через StatusPill. UI-кіт замість голих td.
import { Button, Badge, StatusPill, TD, TR } from '@fade/ui';
import type { CatalogService, ServiceLocation } from './service-types';
import { ServiceInfoCells } from './ServiceInfoCells';

export function ServiceRow({
  service,
  locations,
  onUpdate,
  onPrice,
}: {
  service: CatalogService;
  locations: ServiceLocation[];
  onUpdate: (service: CatalogService, changes: Partial<CatalogService>) => void;
  onPrice: (input: {
    serviceId: string;
    locationId: string;
    amount: number;
    active: boolean;
  }) => void;
}) {
  return (
    <TR>
      <ServiceInfoCells service={service} onUpdate={onUpdate} />
      {locations.map((location) => {
        const current = service.prices.find((item) => item.locationId === location.id);
        return (
          <TD key={location.id}>
            {current ? (
              <div className="flex items-center gap-2">
                <input
                  aria-label={`${service.name}: ціна, ${location.name}`}
                  type="number"
                  min={1}
                  defaultValue={current.amount}
                  className="w-20 rounded-input border border-line bg-surface-sunken px-2 py-1.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                  onBlur={(event) => {
                    const amount = Number(event.target.value);
                    if (amount > 0 && amount !== current.amount)
                      void onPrice({
                        serviceId: service.id,
                        locationId: location.id,
                        amount,
                        active: current.active,
                      });
                  }}
                />
                <label className="flex items-center gap-1.5 text-body text-fg-secondary">
                  <input
                    aria-label={`${service.name}: доступна, ${location.name}`}
                    type="checkbox"
                    checked={current.active}
                    onChange={(event) =>
                      void onPrice({
                        serviceId: service.id,
                        locationId: location.id,
                        amount: current.amount,
                        active: event.target.checked,
                      })
                    }
                  />
                  доступна
                </label>
              </div>
            ) : (
              <span className="text-fg-muted">—</span>
            )}
          </TD>
        );
      })}
      <TD>
        <div className="flex items-center gap-3">
          <StatusPill
            status={service.active ? 'completed' : 'cancelled'}
            label={service.active ? 'Активна' : 'Неактивна'}
          />
          <Button
            variant="ghost"
            size="md"
            onClick={() => void onUpdate(service, { active: !service.active })}
          >
            {service.active ? 'Деактивувати' : 'Активувати'}
          </Button>
          {!service.active && <Badge tone="neutral">прихована з сайту</Badge>}
        </div>
      </TD>
    </TR>
  );
}
