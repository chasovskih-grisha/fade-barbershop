import type { KeyboardEvent } from 'react';
import { Card, Avatar } from '@fade/ui';
import type { BarberDto } from '../types';

// Обрана картка повторює кістяну плитку SlotPicker; класи скопійовані, не імпортовані.
const SELECTED_CARD =
  'rounded-card border border-accent bg-accent p-4 font-medium text-accent-fg cursor-pointer transition-colors hover:bg-fg-secondary active:bg-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

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
  const content = (
    <>
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
    </>
  );
  const choiceProps = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-pressed': selected,
    onClick: () => onChoose(barber.id),
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChoose(barber.id);
      }
    },
  };

  return selected ? (
    <div {...choiceProps} className={`${SELECTED_CARD} flex items-center gap-4`}>
      {content}
    </div>
  ) : (
    <Card interactive={true} {...choiceProps} className="p-4 flex items-center gap-4">
      {content}
    </Card>
  );
}
