// Порт запису візиту для waitlist-сценаріїв (T-174…T-182). Це не агрегатний
// AppointmentRepository: групове бронювання створює рядки записів пачкою,
// тому тут record-level CRUD, а не save(aggregate).
export interface AppointmentRecord {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  startTime: Date;
  status: string;
  source: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** DI-токен: інтерфейс репозиторію не існує в рантаймі. */
export const APPOINTMENT_RECORD_REPOSITORY = 'APPOINTMENT_RECORD_REPOSITORY';

export interface AppointmentRepository {
  create(record: AppointmentRecord): Promise<void>;
  findMany(filter?: Record<string, unknown>): Promise<AppointmentRecord[]>;
}
