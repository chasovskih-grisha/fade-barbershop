import { BarberSchedule, AvailabilityChanged, AvailabilityWindowData } from '../domain/availability';
import { InvalidScheduleInputError } from './availability-errors';

describe('BarberSchedule', () => {
  test('creates schedule with valid ids', () => {
    const windows: AvailabilityWindowData[] = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    const schedule = BarberSchedule.create({ barberId: 'b1', locationId: 'loc1', windows });
    expect(schedule.getBarberId()).toBe('b1');
    expect(schedule.getLocationId()).toBe('loc1');
    expect(schedule.getWindows()).toEqual(windows);
    expect(schedule.getVersion()).toBe(0);
  });

  test('throws on empty barberId', () => {
    expect(() => BarberSchedule.create({ barberId: '', locationId: 'loc1', windows: [] })).toThrow(
      InvalidScheduleInputError
    );
  });

  test('throws on empty locationId', () => {
    expect(() => BarberSchedule.create({ barberId: 'b1', locationId: '', windows: [] })).toThrow(
      InvalidScheduleInputError
    );
  });
});

describe('AvailabilityChanged', () => {
  test('has required DomainEvent properties', () => {
    const windows: AvailabilityWindowData[] = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    const event = new AvailabilityChanged({
      barberId: 'b1',
      locationId: 'loc1',
      windows,
      version: 0,
    });
    expect(event.type).toBe('scheduling.availability.changed');
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe('b1');
    expect(event.payload).toEqual({
      barberId: 'b1',
      locationId: 'loc1',
      windows,
      version: 0,
      source: 'admin',
    });
  });
});
