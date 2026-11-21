import { Button } from '@fade/ui';
import type { LocationEditViewProps } from './location-edit-types';

export default function LocationStatusCard({
  location,
  onToggleActive,
}: Pick<LocationEditViewProps, 'location' | 'onToggleActive'>) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line p-4">
      <h2 className="font-display text-h4">Статус локації</h2>
      <p className="text-body text-fg-muted">
        Неактивна локація не з’являється на сайті й не приймає записів.
      </p>
      <Button variant={location.active ? 'secondary' : 'primary'} onClick={onToggleActive}>
        {location.active ? 'Деактивувати локацію' : 'Активувати локацію'}
      </Button>
    </div>
  );
}
