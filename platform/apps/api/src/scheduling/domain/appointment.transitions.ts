// ADT-модель переходів Appointment (T-042b): дозволені переходи статусів;
// усе інше заборонено — статуси не відкочуються (README scheduling).

export type AppointmentStatus =
  'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  booked: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`Invalid transition ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Агрегат у термінальному статусі (список переходів порожній) — команди
 * крім переходів статусу (reschedule/setReference) заборонені. */
export function ensureAlive(data: { status: AppointmentStatus }): void {
  if (TRANSITIONS[data.status].length === 0)
    throw new InvalidTransitionError(data.status, data.status);
}
