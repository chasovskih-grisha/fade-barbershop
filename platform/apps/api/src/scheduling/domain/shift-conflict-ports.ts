// Порти T-4616a: недоступність, конфлікти та їхнє сховище. Інтервали —
// напіввідкриті [start, end); усі дати передаються як абсолютні Date, тож
// локальну добу локації визначає виклик, а не серверний UTC.
import type {
  BarberUnavailabilityData,
  ShiftConflictData,
  VisitRow,
} from './barber-unavailability';

export interface BarberUnavailabilityRepository {
  save(data: BarberUnavailabilityData): Promise<void>;
  covers(input: {
    barberId: string;
    locationId: string;
    start: Date;
    end: Date;
  }): Promise<boolean>;
  futureVisitsForBarber(input: {
    barberId: string;
    interval: { start: Date; end: Date };
    now: Date;
    locationId?: string;
  }): Promise<VisitRow[]>;
}

export interface ShiftConflictRepository {
  /** Відкриває конфлікт один раз на візит; повертає false, якщо вже існує. */
  open(data: ShiftConflictData): Promise<boolean>;
  findById(id: string): Promise<ShiftConflictData | null>;
  listOpen(filter: {
    barberId?: string;
    locationId?: string;
  }): Promise<ShiftConflictData[]>;
  /** Закриття в межах поточної транзакції; closed-конфлікт не переписується. */
  close(
    id: string,
    input: {
      resolution: 'reassigned' | 'cancelled';
      resolvedBarberId?: string;
      at: Date;
    }
  ): Promise<ShiftConflictData | null>;
}

export interface ShiftConflictAvailability {
  /** Чи є інший барбер, який виконує послугу і має вільний слот. */
  hasOtherBarber(input: ShiftConflictData): Promise<boolean>;
}
