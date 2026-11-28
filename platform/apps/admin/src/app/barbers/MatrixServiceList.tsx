'use client';

import { Checkbox } from '@fade/ui';
import type { MatrixService } from './barber-matrix-data';

// Список послуг локації з чекбоксами (T-4521b). Винесено з
// BarberServiceMatrixEditor за LOC-гейтом.
export function MatrixServiceList({
  services,
  isChecked,
  busy,
  onToggle,
}: {
  services: MatrixService[];
  isChecked: (serviceId: string) => boolean;
  busy: boolean;
  onToggle: (serviceId: string, makeIt: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Послуги локації">
      {services.map((service) => (
        <Checkbox
          key={service.id}
          label={service.name}
          checked={isChecked(service.id)}
          disabled={busy}
          onChange={(event) => onToggle(service.id, event.target.checked)}
        />
      ))}
    </div>
  );
}
