// Специфікація історії статусів Appointment (T-4534): журнал подій outbox
// перетворюється в переходи «було → стало» з актором і причиною; події без
// зміни статусу ігноруються; порядок і сторінка. Чистий домен, без БД.

import { buildStatusHistory, orderHistory, paginateHistory, type StatusHistoryEvent } from './appointment-status-history';

const at = (iso: string) => new Date(iso);
const T = (iso: string) => at(iso);

describe('історія статусів Appointment', () => {
  it('ланцюг статусів дає переходи «було → стало» з актором і часом', () => {
    const events: StatusHistoryEvent[] = [
      { type: 'scheduling.appointment.booked', occurredAt: T('2026-11-02T09:00:00Z') },
      {
        type: 'scheduling.appointment.confirmed',
        occurredAt: T('2026-11-02T09:05:00Z'),
        payload: { actorId: 'admin-1', actorRole: 'admin' },
      },
      {
        type: 'scheduling.appointment.started',
        occurredAt: T('2026-11-02T10:00:00Z'),
        payload: { actorId: 'barber-1', actorRole: 'barber' },
      },
      {
        type: 'scheduling.appointment.completed',
        occurredAt: T('2026-11-02T10:30:00Z'),
      },
    ];

    const history = buildStatusHistory('apt-1', events);

    expect(history.map((entry) => [entry.from, entry.to])).toEqual([
      [null, 'booked'],
      ['booked', 'confirmed'],
      ['confirmed', 'in_progress'],
      ['in_progress', 'completed'],
    ]);
    expect(history[1]!).toMatchObject({ actorId: 'admin-1', actorRole: 'admin' });
    expect(history[3]!.occurredAt).toEqual(T('2026-11-02T10:30:00Z'));
  });

  it('події без зміни статусу (перенос, референс) не потрапляють в історію', () => {
    const events: StatusHistoryEvent[] = [
      { type: 'scheduling.appointment.booked', occurredAt: T('2026-11-02T09:00:00Z') },
      { type: 'scheduling.appointment.rescheduled', occurredAt: T('2026-11-02T09:10:00Z') },
      { type: 'scheduling.appointment.reference_changed', occurredAt: T('2026-11-02T09:11:00Z') },
      {
        type: 'scheduling.appointment.cancelled',
        occurredAt: T('2026-11-02T09:20:00Z'),
        payload: { reason: 'плани змінились' },
      },
    ];

    const history = buildStatusHistory('apt-1', events);

    expect(history.map((entry) => entry.to)).toEqual(['booked', 'cancelled']);
    expect(history[1]!.reason).toBe('плани змінились');
  });

  it('причина скасування та no-show зберігається, порожні поля — null', () => {
    const history = buildStatusHistory('apt-1', [
      { type: 'scheduling.appointment.booked', occurredAt: T('2026-11-02T09:00:00Z') },
      {
        type: 'scheduling.appointment.no_showed',
        occurredAt: T('2026-11-02T09:30:00Z'),
        payload: { actorRole: 'admin' },
      },
    ]);

    expect(history[1]!).toMatchObject({ actorRole: 'admin', actorId: null, reason: null });
  });

  it('orderHistory віддає найновіші зміни першими, не мутуючи вхід', () => {
    const history = buildStatusHistory('apt-1', [
      { type: 'scheduling.appointment.booked', occurredAt: T('2026-11-02T09:00:00Z') },
      { type: 'scheduling.appointment.confirmed', occurredAt: T('2026-11-02T09:05:00Z') },
    ]);

    const ordered = orderHistory(history);

    expect(ordered.map((entry) => entry.to)).toEqual(['confirmed', 'booked']);
    expect(history[0]!.to).toBe('booked');
  });

  it('paginateHistory ріже зріз і повертає повну кількість рядків', () => {
    const events: StatusHistoryEvent[] = Array.from({ length: 5 }, (_, index) => ({
      type: index === 0 ? 'scheduling.appointment.booked' : 'scheduling.appointment.confirmed',
      occurredAt: new Date(Date.UTC(2026, 10, 2, 9, index)),
    }));
    const history = buildStatusHistory('apt-1', events);

    const page = paginateHistory(history, { limit: 2, offset: 1 });

    expect(page.total).toBe(5);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]!.occurredAt).toEqual(new Date(Date.UTC(2026, 10, 2, 9, 1)));
  });

  it('додатковий тест перевіряє порожню історію статусів', () => {
    const history = buildStatusHistory('apt-empty', []);
    expect(history).toEqual([]);
  });
});
