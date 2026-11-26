import { OpeningHours } from './opening-hours';
import { openStatusAt } from './open-status';
import type { DayException } from './open-status';
import { weekDays } from '../test-helpers.fakes';

const KYIV = 'Europe/Kyiv';
// 2026-01-15 — четвер (dayOfWeek 3); у Києві зима, UTC+2.
const THURSDAY_10 = new Date('2026-01-15T10:00:00.000Z'); // 12:00 за Києвом
const THURSDAY_22 = new Date('2026-01-15T22:30:00.000Z'); // 00:30 п'ятниці за Києвом

function hours(overrides: Record<number, { open: string; close: string } | 'closed'> = {}) {
  return OpeningHours.of(weekDays(overrides));
}

describe('openStatusAt', () => {
  it('усередині годин — open із часом закриття', () => {
    expect(openStatusAt({ hours: hours(), now: THURSDAY_10, timeZone: KYIV })).toEqual({
      state: 'open',
      closesAt: '20:00',
    });
  });

  it('до відкриття — closed із часом відкриття', () => {
    expect(
      openStatusAt({ hours: hours(), now: new Date('2026-01-15T06:00:00.000Z'), timeZone: KYIV })
    ).toEqual({ state: 'closed', opensAt: '09:00', reason: null });
  });

  it('після закриття — closed без часу відкриття', () => {
    expect(
      openStatusAt({ hours: hours(), now: new Date('2026-01-15T19:00:00.000Z'), timeZone: KYIV })
    ).toEqual({ state: 'closed', opensAt: null, reason: null });
  });

  it('вихідний день тижневого графіка — closed', () => {
    expect(
      openStatusAt({ hours: hours({ 3: 'closed' }), now: THURSDAY_10, timeZone: KYIV })
    ).toEqual({ state: 'closed', opensAt: null, reason: null });
  });

  it('виняток «зачинено сьогодні» перекриває відкритий день і несе причину', () => {
    const exceptions: DayException[] = [
      { date: '2026-01-15', closed: true, open: null, close: null, reason: 'Ремонт' },
    ];
    expect(openStatusAt({ hours: hours(), exceptions, now: THURSDAY_10, timeZone: KYIV })).toEqual({
      state: 'closed',
      opensAt: null,
      reason: 'Ремонт',
    });
  });

  it('виняток з іншими годинами замінює тижневе вікно', () => {
    const exceptions: DayException[] = [
      { date: '2026-01-15', closed: false, open: '09:00', close: '11:00', reason: 'Короткий день' },
    ];
    expect(openStatusAt({ hours: hours(), exceptions, now: THURSDAY_10, timeZone: KYIV })).toEqual({
      state: 'closed',
      opensAt: null,
      reason: 'Короткий день',
    });
  });

  it('без графіка — undefined, не вигадане «зачинено»', () => {
    expect(openStatusAt({ hours: null, now: THURSDAY_10, timeZone: KYIV })).toEqual({
      state: 'undefined',
    });
  });

  it('день тижня береться з поясу локації, а не з UTC', () => {
    const closedThursday = hours({ 3: 'closed', 4: { open: '00:00', close: '23:00' } });
    // 00:30 п'ятниці за Києвом: п'ятниця відкрита, четвер — ні.
    expect(openStatusAt({ hours: closedThursday, now: THURSDAY_22, timeZone: KYIV })).toEqual({
      state: 'open',
      closesAt: '23:00',
    });
  });
});
