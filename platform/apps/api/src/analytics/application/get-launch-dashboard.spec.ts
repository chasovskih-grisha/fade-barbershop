// T-4439: вікно дашборда — дефолт 7 діб, 1..30, сміття в `days` не валить запит.
import { GetLaunchDashboard, MAX_WINDOW_DAYS, windowDays } from './get-launch-dashboard';
import type { LaunchMetricsSource } from './launch-dashboard.ports';
import type { LaunchCounters } from '../domain/launch-dashboard';

const counters: LaunchCounters = {
  locationsOnline: 1,
  clientsCreated: 2,
  bookingsCreated: 3,
  noShows: 0,
  paymentsCaptured: 2,
  receiptsIssued: 1,
  smsAttempted: 10,
  smsDelivered: 10,
  pushAttempted: 10,
  pushDelivered: 10,
  httpRequests: 100,
  serverErrors: 1,
};

function fakeSource(): { source: LaunchMetricsSource; calls: [Date, Date][] } {
  const calls: [Date, Date][] = [];
  return {
    calls,
    source: {
      async countersBetween(from, to) {
        calls.push([from, to]);
        return counters;
      },
    },
  };
}

describe('GetLaunchDashboard (T-4439)', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-17T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('дефолтне вікно — 7 діб до поточного моменту', async () => {
    const { source, calls } = fakeSource();
    const view = await new GetLaunchDashboard(source).handle();
    expect(view.range.days).toBe(7);
    expect(view.range.to).toBe('2026-11-17T12:00:00.000Z');
    expect(view.range.from).toBe('2026-11-10T12:00:00.000Z');
    expect(calls).toHaveLength(1);
  });

  it('повертає числа й пораховані гейти', async () => {
    const { source } = fakeSource();
    const view = await new GetLaunchDashboard(source).handle({ days: 3 });
    expect(view.counters).toEqual(counters);
    expect(view.gates.ok).toBe(true);
    expect(view.gates.delivery.value).toBe(1);
  });

  it('обмежує вікно 1..30 і не приймає сміття', () => {
    expect(windowDays(undefined)).toBe(7);
    expect(windowDays(Number.NaN)).toBe(7);
    expect(windowDays(0)).toBe(1);
    expect(windowDays(-5)).toBe(1);
    expect(windowDays(2.9)).toBe(2);
    expect(windowDays(999)).toBe(MAX_WINDOW_DAYS);
  });
});
