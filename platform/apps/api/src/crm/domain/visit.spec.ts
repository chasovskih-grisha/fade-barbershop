// Специфікація read-model візиту (T-061): події scheduling згортаються у факт
// історії — статус, учасники, слот; redelivery не регресує стан; події без
// зміни статусу (референс) ігноруються. Чистий домен, без БД.

import { applyVisitEvent, isVisitEvent, type Visit } from './visit';

const at = (iso: string) => new Date(iso);

const event = (type: string, occurredAt: string, payload: Record<string, unknown> = {}) => ({
  type,
  occurredAt: at(occurredAt),
  payload: { appointmentId: 'apt-1', ...payload },
});

describe('read-model візиту (Visit)', () => {
  it('ланцюг подій згортається у факт зі статусом, слотами й учасниками', () => {
    const booked = applyVisitEvent(
      null,
      event('scheduling.appointment.booked', '2026-11-02T09:00:00Z', {
        locationId: 'loc-1',
        barberId: 'barber-1',
        start: '10:00',
        end: '10:30',
      }),
      'client-1'
    ) as Visit;

    const completed = applyVisitEvent(
      booked,
      event('scheduling.appointment.completed', '2026-11-02T10:30:00Z'),
      'client-1'
    ) as Visit;

    expect(completed).toMatchObject({
      appointmentId: 'apt-1',
      clientId: 'client-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      status: 'completed',
      start: '10:00',
      end: '10:30',
    });
    expect(completed.occurredAt).toEqual(at('2026-11-02T10:30:00Z'));
  });

  it('перенесення оновлює слот, не змінюючи статус', () => {
    const booked = applyVisitEvent(
      null,
      event('scheduling.appointment.booked', '2026-11-02T09:00:00Z', {
        start: '10:00',
        end: '10:30',
      }),
      'client-1'
    ) as Visit;

    const moved = applyVisitEvent(
      booked,
      event('scheduling.appointment.rescheduled', '2026-11-02T09:10:00Z', {
        start: '12:00',
        end: '12:30',
      }),
      'client-1'
    ) as Visit;

    expect(moved.status).toBe('booked');
    expect([moved.start, moved.end]).toEqual(['12:00', '12:30']);
  });

  it('повторна доставка старішої події не регресує стан', () => {
    const completed = applyVisitEvent(
      null,
      event('scheduling.appointment.completed', '2026-11-02T10:30:00Z'),
      'client-1'
    ) as Visit;

    const redelivered = applyVisitEvent(
      completed,
      event('scheduling.appointment.confirmed', '2026-11-02T09:05:00Z'),
      'client-1'
    );

    expect(redelivered?.status).toBe('completed');
    expect(redelivered?.occurredAt).toEqual(at('2026-11-02T10:30:00Z'));
  });

  it('подія без зміни статусу (референс) не створює факт', () => {
    const result = applyVisitEvent(
      null,
      event('scheduling.appointment.reference_changed', '2026-11-02T09:00:00Z'),
      'client-1'
    );
    expect(result).toBeNull();
    expect(isVisitEvent('scheduling.appointment.reference_changed')).toBe(false);
    expect(isVisitEvent('scheduling.appointment.booked')).toBe(true);
  });
});
