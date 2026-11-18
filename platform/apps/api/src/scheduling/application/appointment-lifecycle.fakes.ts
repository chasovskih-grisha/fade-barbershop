import { Appointment } from '../domain/appointment.aggregate';
import { AppointmentLifecycle } from './appointment-lifecycle.use-case';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { AppointmentStatus } from '../domain/appointment.aggregate';

export class FakeAppointmentRepository implements AppointmentRepository {
  readonly saved: Appointment[] = [];
  constructor(private readonly store: Map<string, Appointment>) {}
  async save(appointment: Appointment): Promise<void> {
    this.saved.push(appointment);
    this.store.set(appointment.data.id, appointment);
  }
  async findById(id: string): Promise<Appointment | null> {
    return this.store.get(id) ?? null;
  }
  async findByStatus(_status: AppointmentStatus): Promise<Appointment[]> {
    return [...this.store.values()];
  }
}

export const passthroughUow = { run: async <T>(work: () => Promise<T>) => work() };

export function setupLifecycle(initial: Appointment) {
  const store = new Map<string, Appointment>([[initial.data.id, initial]]);
  const repo = new FakeAppointmentRepository(store);
  const lifecycle = new AppointmentLifecycle({ appointments: repo, uow: passthroughUow });
  return { lifecycle, repo };
}

export const bookedAppointment = () =>
  Appointment.book(
    {
      id: 'apt-1',
      bookingId: 'bk-1',
      locationId: 'loc-1',
      barberId: 'barber-1',
      start: '10:00',
      end: '10:30',
    },
    new Date('2026-11-02T09:00:00Z')
  );

export const lifecycleCmd = {
  appointmentId: 'apt-1',
  actorId: 'admin-1',
  actorRole: 'admin' as const,
};
