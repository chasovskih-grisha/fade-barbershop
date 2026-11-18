// Специфікація тривалості та обрізання слоту композиції (T-4520b):
// сума при послідовному режимі, максимум при паралельному, і заборона
// «загортання» суми через кінець безперервного проміжку. Чистий домен.

import { compositionDuration, fitsInOneInterval, compositionStarts } from './composed-slot-span';

describe('Composition slot span (T-4520b)', () => {
  const hair = { serviceId: 'hair', durationMinutes: 45 };
  const beard = { serviceId: 'beard', durationMinutes: 30 };

  it('sums durations sequentially', () => {
    expect(compositionDuration([hair, beard], 'sequential')).toBe(75);
  });

  it('takes the maximum duration in parallel mode', () => {
    expect(compositionDuration([hair, beard], 'parallel')).toBe(45);
  });

  it('treats an empty composition as zero', () => {
    expect(compositionDuration([], 'sequential')).toBe(0);
  });

  it('fits a 90 minute slot only into a continuous interval that holds it', () => {
    const gap = [{ startMinute: 600, endMinute: 675 }]; // 10:00–11:15
    expect(fitsInOneInterval(600, 75, gap)).toBe(true);
    expect(fitsInOneInterval(630, 75, gap)).toBe(false); // 11:45 spills over
  });

  it('does not wrap a composition across a lunch break', () => {
    const aroundLunch = [
      { startMinute: 600, endMinute: 660 }, // 10:00–11:00
      { startMinute: 720, endMinute: 780 }, // 12:00–13:00
    ];
    expect(fitsInOneInterval(600, 90, aroundLunch)).toBe(false);
    expect(fitsInOneInterval(720, 60, aroundLunch)).toBe(true);
  });

  it('keeps only the starts whose whole composition fits', () => {
    const interval = [{ startMinute: 600, endMinute: 660 }];
    expect(compositionStarts([570, 600, 630], 60, interval)).toEqual([600]);
  });
});
