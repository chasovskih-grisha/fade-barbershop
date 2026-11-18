// Словник подій візиту для адмін-деталей: підпис, актор і людські деталі
// за типом outbox-події. Невідомі типи не фарбують журнал порожніми рядками.
import { eventActor, eventDetails, eventLabel } from './admin-booking-detail.events';

describe('словник подій візиту', () => {
  it('підписи за типом події, невідомий тип лишається як є', () => {
    expect(eventLabel('scheduling.appointment.booked')).toBe('Записано');
    expect(eventLabel('scheduling.appointment.confirmed')).toBe('Підтверджено');
    expect(eventLabel('scheduling.appointment.cancelled')).toBe('Скасовано');
    expect(eventLabel('scheduling.appointment.no_showed')).toBe('Не з’явився');
    expect(eventLabel('unknown.type')).toBe('unknown.type');
  });

  it('актор: роль + id, без ролі лишається самостійний запис', () => {
    expect(eventActor({ actorRole: 'admin', actorId: 'admin-1' })).toBe('admin · admin-1');
    expect(eventActor({ actorRole: 'client' })).toBe('client');
    expect(eventActor({})).toBeNull();
  });

  it('деталі: час запису, перенесення, причина скасування без порожнього коментаря', () => {
    expect(eventDetails('scheduling.appointment.booked', { start: '10:00', end: '10:30' })).toEqual(
      ['Час 10:00–10:30']
    );
    expect(
      eventDetails('scheduling.appointment.rescheduled', {
        oldStart: '09:00',
        newStart: '10:00',
        oldEnd: '09:30',
        newEnd: '10:30',
      })
    ).toEqual(['09:00–09:30 → 10:00–10:30']);
    expect(
      eventDetails('scheduling.appointment.cancelled', { reason: 'Господь захворів', comment: '' })
    ).toEqual(['Господь захворів']);
    expect(eventDetails('scheduling.appointment.cancelled', {})).toEqual([]);
    expect(eventDetails('unknown.type', { reason: 'x' })).toEqual([]);
  });
});
