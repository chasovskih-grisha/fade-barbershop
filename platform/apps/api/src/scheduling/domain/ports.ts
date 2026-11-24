import { BarberSchedule } from './availability';
import type { BarberSchedulePolicy } from './barber-self-service';
import type { ScheduleChange } from './schedule-change-log';

export interface AvailabilityRepository {
  /** Find schedule for a specific barber in a location. */
  findByBarberAndLocation(barberId: string, locationId: string): Promise<BarberSchedule | null>;
  /** Save (create or update) a schedule. */
  save(schedule: BarberSchedule): Promise<void>;
  /** Return schedules for all barbers in a location */
  listAllByLocation(locationId: string): Promise<BarberSchedule[]>;
}

/** Політика self-service на барбері (SCH-001/SCH-003). */
export interface SchedulePolicyRepository {
  findForBarber(barberId: string): Promise<BarberSchedulePolicy | null>;
}

/** Журнал змін графіка (SCH-006/SCH-007, SCH-ADM-02). */
export interface ScheduleChangeLogRepository {
  append(change: ScheduleChange): Promise<void>;
  listByBarber(barberId: string): Promise<ScheduleChange[]>;
  /** Журнал мережі для адмінки (SCH-ADM-02). */
  listAll(): Promise<ScheduleChange[]>;
}
