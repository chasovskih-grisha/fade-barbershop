import {
  fullDayInterval,
  todayIso,
  unavailabilityNotice,
  upcomingDays,
} from './barber-unavailability';

describe('barber unavailability day (T-4616b)', () => {
  it('перетворює добу на інтервал до наступного півночі', () => {
    const interval = fullDayInterval('2026-12-01');
    expect(interval).not.toBeNull();
    const start = new Date(String(interval?.start));
    const end = new Date(String(interval?.end));
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('не приймає неіснуючу дату', () => {
    expect(fullDayInterval('2026-02-30')).toBeNull();
    expect(fullDayInterval('01.12.2026')).toBeNull();
    expect(fullDayInterval('')).toBeNull();
  });

  it('показує найближчі дні з підписами «Ср 11.09»', () => {
    const days = upcomingDays('2026-09-09', 3);
    expect(days.map((day) => day.date)).toEqual(['2026-09-09', '2026-09-10', '2026-09-11']);
    expect(days[2]?.label).toBe('Пт 11.09');
  });

  it('бере сьогоднішню дату в локальній добі, не в UTC', () => {
    expect(todayIso(new Date(2026, 0, 2, 23, 30))).toBe('2026-01-02');
  });

  it('каже, що рішення не потрібне, коли візитів немає', () => {
    expect(unavailabilityNotice(0)).toContain('рішення не потрібне');
  });

  it('називає кількість візитів, які чекають рішення засновника', () => {
    expect(unavailabilityNotice(1)).toContain('1 візит чекає рішення засновника');
    expect(unavailabilityNotice(3)).toContain('3 візити чекають рішення засновника');
    expect(unavailabilityNotice(5)).toContain('5 візитів чекають рішення засновника');
    expect(unavailabilityNotice(12)).toContain('12 візитів чекають рішення засновника');
  });
});
