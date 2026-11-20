// Специфікація T-4464: заповненість по днях/годинах, слабкі вікна й підказка
// дії. Час фіксований (Europe/Kyiv), джерело фактів — фейк, тож звіт
// детермінований.
import { BadRequestException } from '@nestjs/common';
import {
  SLOW_HOURS_DEFAULTS,
  localDateKey,
  occupancyCells,
  slowHourAlerts,
  slowHoursReport,
  suggestAction,
  utcFromLocal,
  validateSlowHoursParams,
  weakWindows,
  weekdayOccupancy,
  zonedParts,
  type OccupancyFact,
  type SlowHoursConfig,
} from '../domain/slow-hours';
import {
  GetSlowHours,
  InvalidSlowHoursQueryError,
  parseSlowHoursQuery,
  SLOW_HOURS_CLOCK,
  SLOW_HOURS_SOURCE,
  type SlowHoursClock,
  type SlowHoursSource,
} from './get-slow-hours';
import { AdminSlowHoursController } from '../infrastructure/admin-slow-hours.controller';

const NOW = new Date('2026-11-19T12:00:00Z'); // четвер, 14:00 Europe/Kyiv

function config(overrides: Partial<SlowHoursConfig> = {}): SlowHoursConfig {
  return { ...SLOW_HOURS_DEFAULTS, windowDays: 2, ...overrides };
}

function fact(date: string, hour: number, minutes: number, timeZone = 'Europe/Kyiv'): OccupancyFact {
  const start = utcFromLocal(date, hour, timeZone, NOW);
  return { start, end: new Date(start.getTime() + minutes * 60 * 1000) };
}

function fakeSource(facts: OccupancyFact[]) {
  const calls: Array<{ from: Date; to: Date; locationId?: string }> = [];
  const source: SlowHoursSource = {
    async load(input) {
      calls.push(input);
      return facts;
    },
  };
  return { calls, source };
}

describe('slow hours domain (T-4464)', () => {
  it('converts local Kyiv wall time to UTC and back', () => {
    expect(utcFromLocal('2026-11-19', 14, 'Europe/Kyiv', NOW)).toEqual(NOW);
    expect(zonedParts(NOW)).toEqual({ year: 2026, month: 11, day: 19, hour: 14 });
    expect(localDateKey(new Date('2026-11-19T22:30:00Z'))).toBe('2026-11-20');
  });

  it('builds the occupancy grid per open hour and counts booked minutes', () => {
    const cells = occupancyCells([fact('2026-11-19', 10, 30)], NOW, {
      ...config(),
      openHour: 10,
      closeHour: 12,
      chairs: 1,
    });

    expect(cells).toHaveLength(4); // 2 дні × 2 години
    const ten = cells.find((cell) => cell.date === '2026-11-19' && cell.hour === 10);
    expect(ten).toMatchObject({ bookedMinutes: 30, availableMinutes: 60, occupancyPercent: 50 });
    expect(cells.find((cell) => cell.date === '2026-11-19' && cell.hour === 11)).toMatchObject({
      bookedMinutes: 0,
      occupancyPercent: 0,
    });
  });

  it('caps occupancy at 100% when overlapping facts overfill the hour', () => {
    const cells = occupancyCells(
      [fact('2026-11-19', 10, 40), fact('2026-11-19', 10, 50)],
      NOW,
      { ...config(), windowDays: 1, openHour: 10, closeHour: 11, chairs: 1 }
    );

    expect(cells[0]).toMatchObject({ bookedMinutes: 60, occupancyPercent: 100 });
  });

  it('marks past windows below the threshold and suggests one concrete action', () => {
    const cfg = { ...config(), openHour: 10, closeHour: 12, chairs: 1, thresholdPercent: 40 };
    const cells = occupancyCells(
      [fact('2026-11-18', 10, 18)], // 30% — промо
      NOW,
      cfg
    );

    const weak = weakWindows(cells, NOW, cfg);
    expect(weak.map((window) => `${window.date} ${window.hour}`)).toEqual([
      '2026-11-18 11',
      '2026-11-19 10',
      '2026-11-19 11',
    ]);
    expect(weak[0]?.action.type).toBe('schedule_shift');
    expect(weak[0]?.action.preview).toContain('0 записів');

  });


  it('does not advise on the current or future hour and respects the limit', () => {
    const cfg = { ...config(), windowDays: 1, openHour: 13, closeHour: 15, chairs: 1 };
    const cells = occupancyCells([], NOW, cfg);

    const weak = weakWindows(cells, NOW, cfg, 1);
    // 13:00 вже минула, 14:00 ще триває, 15:00 — майбутня.
    expect(weak).toHaveLength(1);
    expect(weak[0]).toMatchObject({ date: '2026-11-19', hour: 13 });
  });

  it('aggregates occupancy by weekday with Ukrainian labels', () => {
    const byWeekday = weekdayOccupancy(
      occupancyCells([fact('2026-11-19', 10, 60)], NOW, {
        ...config(),
        openHour: 10,
        closeHour: 11,
        chairs: 1,
      })
    );

    const thursday = byWeekday.find((day) => day.weekday === 4);
    expect(thursday).toMatchObject({ label: 'чт', bookedMinutes: 60, occupancyPercent: 100 });
    expect(byWeekday.map((day) => day.weekday)).toEqual([3, 4]);
  });

  it('produces operator alerts and marks thin data', () => {
    const report = slowHoursReport([], NOW, { ...config(), windowDays: 2 });

    expect(report.period).toEqual({ from: '2026-11-18', to: '2026-11-19', windowDays: 2 });
    expect(report.hasEnoughData).toBe(false);
    expect(report.alerts[0]).toContain('Чому не');
    expect(report.alerts.length).toBeLessThanOrEqual(3);

    const single = slowHourAlerts([
      {
        date: '2026-11-19',
        hour: 10,
        bookedMinutes: 0,
        availableMinutes: 60,
        occupancyPercent: 0,
        action: { type: 'promo', label: 'Промо-кампанія', preview: '' },
      },
    ]);
    expect(single).toEqual(['Слабка година: чт, 10:00 — 0% заповнення. Чому не промо-кампанія?']);
  });

  it('validates configurable parameters instead of hardcoding them', () => {
    expect(validateSlowHoursParams({})).toEqual([]);
    expect(validateSlowHoursParams({ days: 0 })).toHaveLength(1);
    expect(validateSlowHoursParams({ days: 61 })).toHaveLength(1);
    expect(validateSlowHoursParams({ thresholdPercent: 101 })).toHaveLength(1);
    expect(validateSlowHoursParams({ chairs: 0 })).toHaveLength(1);
    expect(validateSlowHoursParams({ openHour: 10, closeHour: 10 })).toEqual([
      'closeHour must be after openHour',
    ]);
  });
});

describe('GetSlowHours (T-4464)', () => {
  function useCase(facts: OccupancyFact[] = []) {
    const { calls, source } = fakeSource(facts);
    const clock: SlowHoursClock = { now: () => NOW };
    return { calls, source, clock, useCase: new GetSlowHours(source, clock) };
  }

  it('parses overrides and defaults without hardcoding the threshold', () => {
    const { config: defaults } = parseSlowHoursQuery({});
    expect(defaults).toMatchObject({ windowDays: 14, thresholdPercent: 40, chairs: 2 });

    const { config: custom, locationId } = parseSlowHoursQuery({
      days: '7',
      thresholdPercent: '55',
      chairs: '3',
      openHour: '8',
      closeHour: '20',
      locationId: ' loc-1 ',
    });
    expect(custom).toMatchObject({ windowDays: 7, thresholdPercent: 55, chairs: 3 });
    expect(locationId).toBe('loc-1');

    expect(() => parseSlowHoursQuery({ days: 'abc' })).toThrow(InvalidSlowHoursQueryError);
    expect(() => parseSlowHoursQuery({ thresholdPercent: '0' })).toThrow(InvalidSlowHoursQueryError);
  });

  it('loads the window from the source and returns a stamped report', async () => {
    const { calls, useCase: getSlowHours } = useCase([fact('2026-11-19', 10, 60)]);

    const view = await getSlowHours.handle({ days: '2', thresholdPercent: '100' });

    expect(view.generatedAt).toBe(NOW.toISOString());
    expect(view.locationId).toBeNull();
    expect(calls).toEqual([
      {
        from: new Date('2026-11-17T12:00:00Z'),
        to: NOW,
      },
    ]);
    expect(view.report.weakWindows[0]).toMatchObject({ date: '2026-11-18', hour: 9 });
  });

  it('scopes the read to a location and exposes period labels', async () => {
    const { calls, useCase: getSlowHours } = useCase();

    await getSlowHours.handle({ days: '7', locationId: 'loc-1' });
    expect(calls[0]?.locationId).toBe('loc-1');
    expect(getSlowHours.periodLabels({ days: '7' })).toEqual({
      from: '2026-11-12',
      to: '2026-11-19',
    });
  });

  it('maps invalid parameters to 400 over HTTP and returns the report', async () => {
    const { useCase: getSlowHours } = useCase();
    const api = new AdminSlowHoursController(getSlowHours);

    await expect(api.get({ days: '0' })).rejects.toBeInstanceOf(BadRequestException);

    const view = await api.get({ days: '2', locationId: 'loc-1' });
    expect(view.report.period).toEqual({ from: '2026-11-18', to: '2026-11-19', windowDays: 2 });
    expect(view.report.config.thresholdPercent).toBe(40);
  });
});

// Порти експортуються для перевірки контракту модуля.
it('exports the slow-hours DI tokens (T-4464)', () => {
  expect(SLOW_HOURS_SOURCE).toBeDefined();
  expect(SLOW_HOURS_CLOCK).toBeDefined();
});
