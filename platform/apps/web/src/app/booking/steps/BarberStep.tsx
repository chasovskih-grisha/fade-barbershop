import { useState } from 'react';
import { Button, Skeleton } from '@fade/ui';
import type { BarberDto } from '../types';
import { BarberCard } from './BarberCard';

interface Props {
  barbers: BarberDto[];
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onSelect: (id: string) => void;
  retryBarbers?: () => void;
}

/** Екран 2 (booking-flow.md:114): «Будь-який барбер» перша опція (id '' = any). */
export default function BarberStep({
  barbers,
  loading = false,
  error,
  onBack,
  onSelect,
  retryBarbers,
}: Props) {
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
          <BarberCard
            key={b.id || 'any'}
            barber={b}
            selected={selected === b.id}
            onChoose={setSelected}
          />
        ))}
      </div>
      <Button disabled={selected === null} onClick={() => onSelect(selected ?? '')}>
        Далі
      </Button>
    </div>
  );
}
