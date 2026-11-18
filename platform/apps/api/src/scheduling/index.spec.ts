import * as schedulingIndex from './index';
import { BarberSchedule } from './domain/availability';
import { AvailabilityChanged } from './domain/availability.events';
import { InvalidScheduleInputError, ScheduleConflictError } from './application/availability-errors';
import { SetAvailabilityHandler, ListAvailabilityHandler } from './application/set-availability';
import { SchedulingHttpMapper } from './scheduling-http.mapper';

describe('scheduling/index barrel', () => {
  it('re-exports the scheduling domain and application surface', () => {
    expect(schedulingIndex.BarberSchedule).toBe(BarberSchedule);
    expect(schedulingIndex.AvailabilityChanged).toBe(AvailabilityChanged);
    expect(schedulingIndex.InvalidScheduleInputError).toBe(InvalidScheduleInputError);
    expect(schedulingIndex.ScheduleConflictError).toBe(ScheduleConflictError);
    expect(schedulingIndex.SetAvailabilityHandler).toBe(SetAvailabilityHandler);
    expect(schedulingIndex.ListAvailabilityHandler).toBe(ListAvailabilityHandler);
    expect(schedulingIndex.SchedulingHttpMapper).toBe(SchedulingHttpMapper);
  });
});
