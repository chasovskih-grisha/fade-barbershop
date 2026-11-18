import { DomainEvent } from '../../locations/domain/location.events';

/**
 * Доменне ядро: графік барбера.
 * Кожен барбер може мати кілька часових вікон (availability) у рамках однієї локації.
 * Вікно: { dayOfWeek: 0‑6, start: 'HH:MM', end: 'HH:MM' }.
 * Правила (додатково перевіряються у прикладних use‑case):
 *   • max 2 вікна в день;
 *   • start < end;
 *   • вікна не перекриваються.
 */
export interface AvailabilityWindowData {
  dayOfWeek: number; // 0=неділя … 6=субота
  start: string; // '09:00'
  end: string; // '17:00'
}

/** Джерело зміни графіка (SCH-008): барбер самостійно або адмін. */
export type ScheduleChangeSource = 'barber' | 'admin';

/**
 * Барбер‑специфічний графік (aggregate).
 */
export interface BarberScheduleData {
  barberId: string;
  locationId: string;
  windows: AvailabilityWindowData[];
  version: number;
}

export class BarberSchedule {
  private constructor(private readonly data: BarberScheduleData) {}

  static create(input: {
    barberId: string;
    locationId: string;
    windows: AvailabilityWindowData[];
    version?: number;
  }): BarberSchedule {
    // базова валідація – детальну перевірку у SetAvailabilityHandler
    if (!input.barberId.trim() || !input.locationId.trim())
      throw new InvalidScheduleInputError('Barber ID і Location ID потрібні');
    return new BarberSchedule({ ...input, version: input.version ?? 0 });
  }

  static reconstitute(data: BarberScheduleData): BarberSchedule {
    return new BarberSchedule(data);
  }

  getBarberId(): string {
    return this.data.barberId;
  }
  getLocationId(): string {
    return this.data.locationId;
  }
  getWindows(): AvailabilityWindowData[] {
    return this.data.windows;
  }
  getVersion(): number {
    return this.data.version;
  }
}

/** Domain event emitted when a schedule changes (SCH-008) — with source. */
export class AvailabilityChanged extends DomainEvent {
  static readonly type = 'scheduling.availability.changed';
  readonly type = AvailabilityChanged.type;
  readonly payload: {
    barberId: string;
    locationId: string;
    windows: AvailabilityWindowData[];
    version: number;
    source: ScheduleChangeSource;
  };

  constructor(input: {
    barberId: string;
    locationId: string;
    windows: AvailabilityWindowData[];
    version: number;
    source?: ScheduleChangeSource;
  }) {
    super({ occurredAt: new Date(), aggregateId: input.barberId });
    this.payload = { ...input, source: input.source ?? 'admin' };
  }
}

/** Errors specific to scheduling domain. */
export class InvalidScheduleInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidScheduleInputError';
  }
}

export class ScheduleConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleConflictError';
  }
}
