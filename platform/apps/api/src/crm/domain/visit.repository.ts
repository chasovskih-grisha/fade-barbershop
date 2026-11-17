// VisitRepository — порт read-model візитів (crm, T-061). Проєкція пише факти
// історії з подій scheduling; картки клієнта/барбера їх читають. Запити без
// транзакції — read-шлях; upsert за appointmentId робить запис ідемпотентним.
import type { Visit } from './visit';

export interface VisitRepository {
  findByAppointmentId(appointmentId: string): Promise<Visit | null>;
  save(visit: Visit): Promise<void>;
  listByClientId(clientId: string): Promise<Visit[]>;
}
