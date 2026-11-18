// Секція «Час» форми візиту (T-4409): стан завантаження, порожній день,
// помилка завантаження й сам SlotPicker. Відокремлено від VisitFormFields,
// щоб форма лишалася лише про вибір довідників і приховані поля.
'use client';

import { useMemo } from 'react';
import { SlotPicker, type Slot } from '@fade/ui';
import type { AvailableSlotDto } from './types';

interface SlotSectionProps {
  slots: AvailableSlotDto[];
  loading: boolean;
  error: string;
  date: string;
  barberId: string;
  picked: AvailableSlotDto | null;
  onPick: (slot: AvailableSlotDto | null) => void;
}

export function SlotSection({
  slots,
  loading,
  error,
  date,
  barberId,
  picked,
  onPick,
}: SlotSectionProps) {
  const slotButtons: Slot[] = useMemo(
    () =>
      slots.map((slot, index) => ({
        id: `slot-${index}`,
        time: `${slot.start} – ${slot.end}`,
        state: slot.barbers.length ? 'free' : 'busy',
      })),
    [slots]
  );

  const pickedId = useMemo(() => {
    if (!picked) return null;
    const index = slots.findIndex((slot) => slot.start === picked.start && slot.end === picked.end);
    return index >= 0 ? `slot-${index}` : null;
  }, [picked, slots]);

  const selectSlot = (slotId: string): void => {
    const index = Number(slotId.split('-')[1]);
    onPick(Number.isFinite(index) ? (slots[index] ?? null) : null);
  };

  return (
    <>
      <label className="block mb-2" htmlFor="slotPicker">
        Час
      </label>
      {error && (
        <p role="alert" className="mb-3 text-danger" data-testid="slot-loading-error">
          {error}
        </p>
      )}
      {loading ? (
        <div
          className="border rounded px-3 py-6 text-center text-sm text-fg-secondary"
          aria-live="polite"
        >
          Завантаження слотів&#8230;
        </div>
      ) : slots.length === 0 && date && barberId ? (
        <div className="border rounded px-3 py-6 text-center text-sm text-fg-secondary">
          На цю дату слотів немає — оберіть іншу дату або іншого барбера.
        </div>
      ) : (
        <SlotPicker
          slots={slotButtons}
          value={pickedId}
          onChange={selectSlot}
        />
      )}
    </>
  );
}
