import { SlotValidator, InvalidSlotError } from '../domain/slot-validator';
import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { makeOpeningHours, SERVICE_DURATION } from './validate-slot.fakes';

describe('SlotValidator additional branches', () => {
  const day = 0;
  const opening = makeOpeningHours({ day, open: '08:00', close: '20:00' });
  const windows: AvailabilityWindowData[] = [{ dayOfWeek: day, start: '09:00', end: '12:00' }];
  const schedule = BarberSchedule.create({ barberId: 'b1', locationId: 'loc1', windows });
  const validator = new SlotValidator(schedule, opening, SERVICE_DURATION);

  test('rejects a malformed time format', () => {
    expect(() => validator.validate({ dayOfWeek: day, start: '9:15', end: '09:45' })).toThrow(
      InvalidSlotError
    );
    expect(() => validator.validate({ dayOfWeek: day, start: '09:15', end: '9:45' })).toThrow(
      InvalidSlotError
    );
    expect(() => validator.validate({ dayOfWeek: day, start: '24:00', end: '09:45' })).toThrow(
      InvalidSlotError
    );
  });

  test('rejects an end at or before the start', () => {
    expect(() => validator.validate({ dayOfWeek: day, start: '09:15', end: '09:15' })).toThrow(
      /End must be after start/
    );
  });

  test('rejects a non-positive or non-integer service duration', () => {
    expect(() =>
      new SlotValidator(schedule, opening, 0).validate({
        dayOfWeek: day,
        start: '09:15',
        end: '09:45',
      })
    ).toThrow(/Invalid service duration/);
    expect(() =>
      new SlotValidator(schedule, opening, 30.5).validate({
        dayOfWeek: day,
        start: '09:15',
        end: '09:45',
      })
    ).toThrow(/Invalid service duration/);
  });

  test('a day with hours unset skips the opening-hours window check', () => {
    const rawHours = {
      days: [{ dayOfWeek: day, open: null, close: null, closed: false }],
    } as unknown as OpeningHours;
    const validator2 = new SlotValidator(schedule, rawHours, SERVICE_DURATION);
    expect(() =>
      validator2.validate({ dayOfWeek: day, start: '10:00', end: '10:30' })
    ).not.toThrow();
  });
});
