import { OpeningHours } from '../../locations/domain/opening-hours';
import { InvalidWorkdayExceptionError, createWorkdayException, effectiveDayWindow, hasWorkdayExceptionOverlap, type WorkdayExceptionData } from './workday-exception';

const exception = (over: Partial<WorkdayExceptionData> = {}): WorkdayExceptionData => ({
  id: '0190f1c2-0000-7000-8000-0000000000e1',
  locationId: '0190f1c2-0000-7000-8000-0000000000c1',
  date: '2026-12-25',
  closed: true,
  open: null,
  close: null,
  reason: 'Різдво',
  createdBy: '0190f1c2-0000-7000-8000-0000000000d1',
  ...over,
});

const week = (open: string, close: string) =>
  OpeningHours.of(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, open, close, closed: false }))
  );

describe('workday exceptions (T-4414)', () => {
  it('rejects a malformed date', () => {
    expect(() => createWorkdayException(exception({ date: '2026-99-99' }))).toThrow(
      InvalidWorkdayExceptionError
    );
  });

  it('rejects an exception without a reason', () => {
    expect(() => createWorkdayException(exception({ reason: '  ' }))).toThrow(/needs a reason/);
  });

  it('rejects open hours that are not HH:MM', () => {
    expect(() =>
      createWorkdayException(exception({ closed: false, open: '9:00', close: '18:00' }))
    ).toThrow(/HH:MM/);
  });

  it('rejects open after close', () => {
    expect(() =>
      createWorkdayException(exception({ closed: false, open: '18:00', close: '18:00' }))
    ).toThrow(/Open must be before close/);
  });

  it('keeps a custom-hours exception and drops hours on a closed one', () => {
    const custom = createWorkdayException(
      exception({ closed: false, open: '10:00', close: '14:00' })
    );
    expect(custom).toMatchObject({ open: '10:00', close: '14:00' });
    expect(createWorkdayException(exception({ open: '10:00', close: '14:00' }))).toMatchObject({
      closed: true,
      open: null,
      close: null,
    });
  });
});

describe('effective day window (T-4414)', () => {
  const opening = week('09:00', '20:00');

  it('uses the weekly schedule when there is no exception', () => {
    expect(effectiveDayWindow(opening, 3, null)).toEqual({ start: 540, end: 1200 });
  });

  it('gives no window at all on a closed day', () => {
    expect(effectiveDayWindow(opening, 3, exception())).toBeNull();
  });

  it('replaces the weekly hours with the exception hours', () => {
    const custom = createWorkdayException(
      exception({ closed: false, open: '10:00', close: '14:00' })
    );
    expect(effectiveDayWindow(opening, 3, custom)).toEqual({ start: 600, end: 840 });
  });

  it('leaves a normally closed weekday closed without an exception', () => {
    const sundayClosed = OpeningHours.of(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        open: dayOfWeek === 6 ? null : '09:00',
        close: dayOfWeek === 6 ? null : '20:00',
        closed: dayOfWeek === 6,
      }))
    );
    expect(effectiveDayWindow(sundayClosed, 6, null)).toBeNull();
  });
});

describe('workday exception overlap (T-4414)', () => {
  it('detects overlap for the same location and date', () => {
    const existing = exception({ id: 'ex-1', date: '2026-12-25' });
    const candidate = exception({ id: 'ex-2', date: '2026-12-25' });
    expect(hasWorkdayExceptionOverlap([existing], candidate)).toBe(true);
  });

  it('allows different dates or locations', () => {
    const existing = exception({ id: 'ex-1', date: '2026-12-25' });
    const candidateDifferentDate = exception({ id: 'ex-2', date: '2026-12-26' });
    expect(hasWorkdayExceptionOverlap([existing], candidateDifferentDate)).toBe(false);
  });
});
