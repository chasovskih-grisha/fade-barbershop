import { SlotValidator, InvalidSlotError, TimeSlotData } from '../domain/slot-validator';
import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { makeOpeningHours, SERVICE_DURATION } from './validate-slot.fakes';

describe('SlotValidator', () => {
  const day = 0; // Monday
  const opening = makeOpeningHours({ day, open: '08:00', close: '20:00' });
  const windows: AvailabilityWindowData[] = [
    { dayOfWeek: day, start: '09:00', end: '12:00' },
    { dayOfWeek: day, start: '13:00', end: '17:00' },
  ];
  const schedule = BarberSchedule.create({ barberId: 'b1', locationId: 'loc1', windows });
  const validator = new SlotValidator(schedule, opening, SERVICE_DURATION);

  test('valid slot passes', () => {
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:15', end: '09:45' };
    expect(() => validator.validate(slot)).not.toThrow();
  });

  test('accepts exact availability boundaries and rejects a slot crossing a closed gap', () => {
    expect(() =>
      validator.validate({ dayOfWeek: day, start: '09:00', end: '09:30' })
    ).not.toThrow();
    expect(() =>
      validator.validate({ dayOfWeek: day, start: '11:30', end: '12:00' })
    ).not.toThrow();
    expect(() => validator.validate({ dayOfWeek: day, start: '11:45', end: '12:15' })).toThrow(
      InvalidSlotError
    );
  });

  test('rejects a slot on the following day when that weekday has no availability', () => {
    expect(() => validator.validate({ dayOfWeek: 1, start: '09:15', end: '09:45' })).toThrow(
      InvalidSlotError
    );
  });

  test('slot not on 15‑minute boundary fails', () => {
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:10', end: '09:40' };
    expect(() => validator.validate(slot)).toThrow(InvalidSlotError);
  });

  test('slot shorter than service duration fails', () => {
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:15', end: '09:35' };
    expect(() => validator.validate(slot)).toThrow(InvalidSlotError);
  });

  test('slot outside any availability window fails', () => {
    const slot: TimeSlotData = { dayOfWeek: day, start: '12:30', end: '13:00' };
    expect(() => validator.validate(slot)).toThrow(InvalidSlotError);
  });

  test('slot outside opening hours fails', () => {
    const earlyOpening = makeOpeningHours({ day, open: '10:00', close: '20:00' });
    const earlyValidator = new SlotValidator(schedule, earlyOpening, SERVICE_DURATION);
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:15', end: '09:45' };
    expect(() => earlyValidator.validate(slot)).toThrow(InvalidSlotError);
  });

  test('slot on closed day fails', () => {
    const closedOpening = makeOpeningHours({ day, open: '08:00', close: '20:00', closed: true });
    const closedValidator = new SlotValidator(schedule, closedOpening, SERVICE_DURATION);
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:15', end: '09:45' };
    expect(() => closedValidator.validate(slot)).toThrow(InvalidSlotError);
  });

  test('invalid dayOfWeek fails', () => {
    const slot: TimeSlotData = { dayOfWeek: 7, start: '09:15', end: '09:45' };
    expect(() => validator.validate(slot)).toThrow(InvalidSlotError);
  });
});
