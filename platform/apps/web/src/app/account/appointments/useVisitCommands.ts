'use client';

// Команди візиту з «Моїх візитів»: скасування, перенесення, редагування
// референсу (T-043, REF-WEB-04). Винесено з useAppointmentsPage — той уже на
// межі LOC-гейту (ADR 0019), а команди — окрема відповідальність.
import { useCallback } from 'react';
// prettier-ignore
import { cancelAppointment, rescheduleAppointment, setAppointmentReference, type ExtendedAppointment } from '@/lib/api/appointments';
import type { ReferenceEdit } from './useReferenceEditor';
import {
  trackAppointmentRescheduled,
  trackAppointmentCancelled,
  trackReferenceUpdated,
} from './visit-actions';

/** Спільний раннер сторінки: показує помилку або перезавантажує список. */
export type VisitAction = (key: string, action: () => Promise<void>) => Promise<void>;

export function useVisitCommands({
  apply,
  selected,
}: {
  apply: VisitAction;
  selected: ExtendedAppointment | null;
}) {
  // Ключ дії включає id візиту — щоб картка показувала спінер саме на своєму рядку.
  const onSelected = useCallback(
    (prefix: string, command: (id: string) => Promise<void>) => {
      if (!selected) return Promise.resolve();
      return apply(`${prefix}-${selected.id}`, () => command(selected.id));
    },
    [apply, selected]
  );

  return {
    confirmCancel: () =>
      onSelected('cancel', async (id) => {
        await cancelAppointment(id);
        trackAppointmentCancelled(id);
      }),
    confirmReschedule: (when: { date: string; start: string; end: string }) =>
      onSelected('reschedule', async (id) => {
        await rescheduleAppointment(id, when);
        trackAppointmentRescheduled(id);
      }),
    confirmReference: (reference: ReferenceEdit) =>
      onSelected('reference', async (id) => {
        await setAppointmentReference(id, reference);
        trackReferenceUpdated(id);
      }),
  };
}
