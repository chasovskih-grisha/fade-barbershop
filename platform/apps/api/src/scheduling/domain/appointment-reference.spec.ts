// Специфікація setReference (T-043): референс/коментар на живому записі,
// '' прибирає значення, термінальний статус заборонений. Подія — журнал змін.
import { Appointment, InvalidTransitionError } from './appointment.aggregate';

const T0 = new Date('2026-11-02T09:00:00Z');
const base = {
  id: 'apt-1',
  bookingId: 'bk-1',
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '10:00',
  end: '10:30',
} as const;

describe('Appointment.setReference (T-043)', () => {
  it('ставить референс і коментар, подія reference_changed несе payload', () => {
    const a = Appointment.book(base, T0);
    a.setReference(
      { referenceId: 'ref-42', comment: 'зняти на 2 мм', actorId: 'client-1', actorRole: 'client' },
      T0
    );
    expect(a.data.haircutReferenceId).toBe('ref-42');
    expect(a.data.appointmentComment).toBe('зняти на 2 мм');
    expect(a.data.status).toBe('booked');
    const event = a.pullEvents().at(-1);
    expect(event?.type).toBe('scheduling.appointment.reference_changed');
    expect(event?.payload).toMatchObject({
      appointmentId: 'apt-1',
      haircutReferenceId: 'ref-42',
      comment: 'зняти на 2 мм',
      actorRole: 'client',
    });
  });

  it('часткове оновлення: лише коментар — референс не чіпається', () => {
    const a = Appointment.book(base, T0);
    a.setReference({ referenceId: 'ref-42' }, T0);
    a.setReference({ comment: 'чубчик залишити' }, T0);
    expect(a.data.haircutReferenceId).toBe('ref-42');
    expect(a.data.appointmentComment).toBe('чубчик залишити');
  });

  it("порожній рядок прибирає значення ('' → null)", () => {
    const a = Appointment.book(base, T0);
    a.setReference({ referenceId: 'ref-42', comment: 'текст' }, T0);
    a.setReference({ referenceId: '', comment: '' }, T0);
    expect(a.data.haircutReferenceId).toBeNull();
    expect(a.data.appointmentComment).toBeNull();
  });

  it('термінальний статус (cancelled) — InvalidTransitionError, дані не змінено', () => {
    const a = Appointment.book(base, T0);
    a.cancel({}, T0);
    expect(() => a.setReference({ referenceId: 'ref-42' }, T0)).toThrow(InvalidTransitionError);
    expect(a.data.haircutReferenceId ?? null).toBeNull();
  });
});
