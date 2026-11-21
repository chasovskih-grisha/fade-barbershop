import { Card, Avatar } from '@fade/ui';
import type { BarberDto } from '../types';

/** Картка барбера екрану 2: «Будь-який барбер», фото (опційно), ім'я, чип локації. */
export function BarberCard({
  barber,
  selected,
  onChoose,
}: {
  barber: BarberDto;
  selected: boolean;
  onChoose: (id: string) => void;
}) {
  return (
    <Card
      interactive={true}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={`p-4 flex items-center gap-4 ${selected ? 'ring-2 ring-fg' : ''}`}
      onClick={() => onChoose(barber.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChoose(barber.id);
        }
      }}
    >
      {barber.any ? (
        <div
          className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center font-semibold text-h4"
          aria-hidden="true"
        >
          ★
        </div>
      ) : barber.photo ? (
        <img
          src={barber.photo.url}
          alt={barber.photo.alt}
          width={barber.photo.width ?? 48}
          height={barber.photo.height ?? 48}
          loading="lazy"
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <Avatar name={barber.name} size="lg" />
      )}
      <div className="flex flex-col">
        <h3 className="font-text text-h4 font-semibold">
          {barber.any ? 'Будь‑який барбер' : barber.name}
        </h3>
        {barber.locationName && !barber.any && (
          <span className="text-xs text-fg-secondary mt-0.5">{barber.locationName}</span>
        )}
      </div>
    </Card>
  );
}
