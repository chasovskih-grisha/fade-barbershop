import type { DayHours } from '../HoursEditor';
import {
  REPRESENTATIVE_SERVICE_MINUTES,
  effectiveSlotMinutes,
  estimateDailySlots,
  openWindowMinutes,
  capacityEstimateLabel,
} from './slot-policy-capacity';
import type { PolicyValues } from './slot-policy-fields';

const week = (over: Partial<DayHours>): DayHours[] => [
  { dayOfWeek: 0, open: '09:00', close: '21:00', closed: false, ...over },
];

const policy = (over: Partial<PolicyValues> = {}): PolicyValues => ({
  stepMinutes: 15,
  bufferMinutes: 0,
  horizonDays: 14,
  lastMinuteMinutes: 60,
  ...over,
});

describe('slot policy capacity estimate (T-4522)', () => {
  it('adds the buffer after a grid-aligned service block', () => {
    // 30-хв послуга на кроці 15 = 2 блоки (30 хв), плюс 15 хв буферу.
    expect(effectiveSlotMinutes(15, 15)).toBe(45);
    expect(effectiveSlotMinutes(15, 0)).toBe(30);
    // Крок 60: 30-хв послуга все одно займає цілий блок сітки.
    expect(effectiveSlotMinutes(60, 30)).toBe(90);
  });

  it('rounds a service up to the grid before the buffer is added', () => {
    // 45-хв послуга на кроці 30 = 2 блоки (60 хв) + 0 буферу.
    expect(effectiveSlotMinutes(30, 0, 45)).toBe(60);
  });

  it('estimates fewer slots as the buffer grows', () => {
    const windowMinutes = 12 * 60;
    const noBuffer = estimateDailySlots(policy({ bufferMinutes: 0 }), windowMinutes);
    const withBuffer = estimateDailySlots(policy({ bufferMinutes: 15 }), windowMinutes);
    expect(noBuffer).toBe(24); // 720 / 30
    expect(withBuffer).toBe(16); // 720 / 45
    expect(withBuffer).toBeLessThan(noBuffer);
  });

  it('reads the longest open day and falls back to 8 hours without data', () => {
    const days: DayHours[] = [
      { dayOfWeek: 0, open: '09:00', close: '13:00', closed: false },
      { dayOfWeek: 1, open: '10:00', close: '20:00', closed: false },
      { dayOfWeek: 2, open: null, close: null, closed: true },
    ];
    expect(openWindowMinutes(days)).toBe(10 * 60);
    expect(openWindowMinutes([])).toBe(8 * 60);
    expect(openWindowMinutes(undefined)).toBe(8 * 60);
  });

  it('renders a text-only estimate label without hex or px', () => {
    const label = capacityEstimateLabel(policy({ bufferMinutes: 15 }), week({}));
    expect(label).toBe(
      `≈ 16 слотів за 12-годинний день (послуга ${REPRESENTATIVE_SERVICE_MINUTES} хв).`
    );
    expect(label).not.toMatch(/#|px/);
  });
});
