import { useState } from 'react';
import { Card, Button, Skeleton, Avatar } from '@fade/ui';
import { BarberDto } from '../types';

interface Props {
  barbers: BarberDto[];
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onSelect: (id: string) => void;
  retryBarbers?: () => void;
}

/** Екран 2 (booking-flow.md:114): «Будь-який барбер» перша опція (id '' = any);
 * фото (опційно), ім'я, чип локації; фолбек на Avatar з ініціалами. */
export default function BarberStep({ barbers, loading = false, error, onBack, onSelect, retryBarbers }: Props) {
  // null = нічого не обрано; '' = «Будь-який барбер» (валідний вибір).
  const [selected, setSelected] = useState<string | null>(null);
  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2" role="alert">
        <p className="text-fg-secondary">Не вдалося завантажить барберів.</p>
        <Button onClick={retryBarbers}>Спробувати ще раз</Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Оберіть барбера</h2>
      {barbers.length <= 1 && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-fg-secondary">У цій локації барберів ще немає.</p>
          <Button variant="secondary" onClick={onBack}>
            Повернутись до послуг
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barbers.map((b) => (
          <Card
            key={b.id || 'any'}
            interactive={true}
            role="button"
            tabIndex={0}
            aria-pressed={selected === b.id}
            className={`p-4 flex items-center gap-4 ${selected === b.id ? 'ring-2 ring-fg' : ''}`}
            onClick={() => setSelected(b.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(b.id);
              }
            }}
          >
            {b.any ? (
              <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center font-semibold text-h4" aria-hidden="true">
                ★
              </div>
            ) : b.photo ? (
              <img
                src={b.photo.url}
                alt={b.photo.alt}
                width={b.photo.width ?? 48}
                height={b.photo.height ?? 48}
                loading="lazy"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Avatar name={b.name} size="lg" />
            )}
            <div className="flex flex-col">
              <h3 className="font-text text-h4 font-semibold">
                {b.any ? 'Будь‑який барбер' : b.name}
              </h3>
              {b.locationName && !b.any && (
                <span className="text-xs text-fg-secondary mt-0.5">{b.locationName}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Button disabled={selected === null} onClick={() => onSelect(selected ?? '')}>
        Далі
      </Button>
    </div>
  );
}
