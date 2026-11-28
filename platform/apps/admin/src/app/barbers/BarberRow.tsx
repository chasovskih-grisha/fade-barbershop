'use client';

import { Button, StatusPill, TD, TR } from '@fade/ui';

export type Barber = {
  id: string;
  name: string | null;
  phone: string;
  active: boolean;
};

export function BarberRow({
  barber,
  selected,
  onToggle,
  onSelect,
}: {
  barber: Barber;
  selected: string;
  onToggle: (barber: Barber) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <TR data-selected={selected === barber.id}>
      <TD className="font-medium">{barber.name ?? '—'}</TD>
      <TD className="tabular-nums text-fg-secondary">{barber.phone}</TD>
      <TD>
        <StatusPill
          status={barber.active ? 'completed' : 'cancelled'}
          label={barber.active ? 'Активний' : 'Неактивний'}
        />
      </TD>
      <TD>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={barber.active ? 'ghost' : 'secondary'}
            size="md"
            onClick={() => void onToggle(barber)}
          >
            {barber.active ? 'Деактивувати' : 'Активувати'}
          </Button>
          <Button
            variant={selected === barber.id ? 'secondary' : 'ghost'}
            size="md"
            onClick={() => onSelect(selected === barber.id ? '' : barber.id)}
          >
            Графік і локації
          </Button>
        </div>
      </TD>
    </TR>
  );
}
