import { OpeningHours } from '../../locations/domain/opening-hours';
import { weekDays } from '../../locations/test-helpers.fakes';
import type { AvailabilityWindowData } from './availability';
import { assertScheduleEditAllowed, assertWindowsWithinOpeningHours, ScheduleNotAllowedError, type ScheduleEditor } from './barber-self-service';

const delegated: ScheduleEditor = {
  policy: { selfService: true, allowOutsideHours: false },
  source: 'barber',
};
const blocked: ScheduleEditor = {
  policy: { selfService: false, allowOutsideHours: false },
  source: 'barber',
};
const admin: ScheduleEditor = {
  policy: { selfService: false, allowOutsideHours: false },
  source: 'admin',
};
const opening = OpeningHours.of(weekDays());
const window: AvailabilityWindowData = { dayOfWeek: 0, start: '10:00', end: '12:00' };

describe('assertScheduleEditAllowed (SCH-001)', () => {
  it('lets the admin edit and blocks a barber without delegation', () => {
    expect(() => assertScheduleEditAllowed(admin)).not.toThrow();
    expect(() => assertScheduleEditAllowed(blocked)).toThrow(ScheduleNotAllowedError);
    expect(() => assertScheduleEditAllowed(delegated)).not.toThrow();
  });
});

describe('assertWindowsWithinOpeningHours (SCH-003)', () => {
  it('keeps a delegated barber strictly inside opening hours', () => {
    expect(() => assertWindowsWithinOpeningHours([window], opening, delegated)).not.toThrow();
    expect(() =>
      assertWindowsWithinOpeningHours([{ ...window, start: '08:00' }], opening, delegated)
    ).toThrow(ScheduleNotAllowedError);
  });

  it('lets the admin and an explicit allowance override the bound', () => {
    expect(() =>
      assertWindowsWithinOpeningHours([{ ...window, start: '08:00' }], opening, admin)
    ).not.toThrow();
    expect(() =>
      assertWindowsWithinOpeningHours([{ ...window, start: '08:00' }], opening, {
        policy: { selfService: true, allowOutsideHours: true },
        source: 'barber',
      })
    ).not.toThrow();
  });

  it('rejects a window on a day the location is closed', () => {
    const sundayClosed = OpeningHours.of(weekDays({ 0: 'closed' }));
    expect(() => assertWindowsWithinOpeningHours([window], sundayClosed, delegated)).toThrow(
      ScheduleNotAllowedError
    );
  });
});
