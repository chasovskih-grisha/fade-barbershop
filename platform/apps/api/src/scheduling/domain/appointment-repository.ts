// Порт репозиторія Appointment (T-042a): інфраструктура зберігає агрегат і
// дописує його pull-події в outbox тією ж транзакцією. Домен не знає Prisma.

import type { Appointment, AppointmentStatus } from './appointment.aggregate';

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByStatus(status: AppointmentStatus, onOrAfter: Date): Promise<Appointment[]>;
}
