import { AvailabilityWindowData, BarberSchedule } from '../domain/availability';
import type { BarberSchedulePolicy } from '../domain/barber-self-service';
import type { ScheduleChange } from '../domain/schedule-change-log';
import {
  AvailabilityRepository,
  ScheduleChangeLogRepository,
  SchedulePolicyRepository,
} from '../domain/ports';

/** Simple in‑memory fake repository for tests */
export class FakeAvailabilityRepository implements AvailabilityRepository {
  private data: Map<string, BarberSchedule> = new Map();
  async findByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<BarberSchedule | null> {
    return this.data.get(`${barberId}:${locationId}`) ?? null;
  }
  async save(schedule: BarberSchedule): Promise<void> {
    this.data.set(`${schedule.getBarberId()}:${schedule.getLocationId()}`, schedule);
  }
  async listAllByLocation(locationId: string): Promise<BarberSchedule[]> {
    const result: BarberSchedule[] = [];
    for (const [key, schedule] of this.data.entries()) {
      if (key.endsWith(`:${locationId}`)) result.push(schedule);
    }
    return result;
  }
}

/** In-memory політика self-service на барбера. */
export class FakeSchedulePolicyRepository implements SchedulePolicyRepository {
  private readonly policies = new Map<string, BarberSchedulePolicy>();
  set(barberId: string, policy: BarberSchedulePolicy): void {
    this.policies.set(barberId, policy);
  }
  async findForBarber(barberId: string): Promise<BarberSchedulePolicy | null> {
    return this.policies.get(barberId) ?? null;
  }
}

/** In-memory журнал змін графіка. */
export class FakeScheduleChangeLogRepository implements ScheduleChangeLogRepository {
  readonly changes: ScheduleChange[] = [];
  async append(change: ScheduleChange): Promise<void> {
    this.changes.push(change);
  }
  async listByBarber(barberId: string): Promise<ScheduleChange[]> {
    return this.changes.filter((change) => change.barberId === barberId);
  }
  async listAll(): Promise<ScheduleChange[]> {
    return [...this.changes];
  }
}

export type { AvailabilityWindowData };
