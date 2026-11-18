'use client';

// Стан перетягування візиту в сітці календаря (T-4524a): який рядок тягнуть,
// які рядки — валідні цілі, і POST переносу тим самим use case, що й картка
// (T-4533). Ціль — візит того самого барбера: перенос не міняє барбера, тож
// чужий стовпець лишається недоступним. Конфлікт слота (409) показуємо текстом.
import { useState } from 'react';
import { canDrag, rescheduleWhen } from './drag-reschedule';
import type { CalendarVisit } from './visit-status';

const hhmm = (iso: string) => iso.slice(11, 16);

export function useVisitDrag(onDone: () => void) {
  const [dragging, setDragging] = useState<CalendarVisit | null>(null);
  const [error, setError] = useState('');

  const start = (visit: CalendarVisit) => {
    if (canDrag(visit)) {
      setDragging(visit);
      setError('');
    }
  };
  const end = () => setDragging(null);
  /** Ціль доступна, лише якщо це інший візит того самого барбера. */
  const canDrop = (visit: CalendarVisit): boolean =>
    dragging !== null && dragging.id !== visit.id && dragging.barberId === visit.barberId;

  const drop = async (target: CalendarVisit): Promise<void> => {
    if (!dragging || !canDrop(target)) return;
    const moved = dragging;
    const when = rescheduleWhen(moved, hhmm(target.start));
    setDragging(null);
    if (!when) {
      setError('Цей слот не вміщує візит — оберіть інший час');
      return;
    }
    const response = await fetch(`/admin/appointments/${moved.id}/reschedule`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(when),
    });
    if (response.ok) {
      setError('');
      onDone();
      return;
    }
    setError(response.status === 409 ? 'Слот зайнятий' : 'Не вдалося перенести візит');
  };

  return { draggingId: dragging?.id ?? '', error, start, end, canDrop, drop };
}
