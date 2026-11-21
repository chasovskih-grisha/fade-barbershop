/* eslint-disable max-lines -- cohesive module (194 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4560: журнал причин скасувань і no-show, статистика та ручний override.
//
// Порт `CancellationReasonRepository` не залежить від сховища: у проді його
// реалізує `PrismaCancellationReasonRepository`, у тестах — in-memory.
import { Inject, Injectable } from '@nestjs/common';
import {
  cancellationRate,
  groupNoShowRates,
  hourOf,
  parseCancellationReason,
  parseNoShowReason,
  ReasonedEventNotFoundError,
  toReasonedEventsCsv,
  topReasons,
  weekdayOf,
  type BookingChannel,
  type CancellationActor,
  type CancellationReason,
  type NoShowReason,
  type RateBucket,
  type ReasonedEvent,
  type ReasonInput,
} from '../domain/cancellation-reasons';

export const CANCELLATION_REASON_REPOSITORY = 'CANCELLATION_REASON_REPOSITORY';

export interface CancellationReasonRepository {
  save(event: ReasonedEvent): Promise<void>;
  list(): Promise<ReasonedEvent[]>;
}

export class InMemoryCancellationReasonRepository implements CancellationReasonRepository {
  private readonly events: ReasonedEvent[] = [];

  async save(event: ReasonedEvent): Promise<void> {
    this.events.push(event);
  }

  async list(): Promise<ReasonedEvent[]> {
    return [...this.events];
  }
}

export interface BookingRef {
  appointmentId: string;
  clientId: string;
  barberId: string;
  serviceId?: string | null;
  locationId: string;
  channel: BookingChannel;
  start: Date;
  cancelledBy: CancellationActor;
  at?: Date;
}

export interface CancellationInput extends BookingRef, ReasonInput {}

export interface NoShowInput extends BookingRef, ReasonInput {
  excused?: boolean;
}

export interface ReasonedStats {
  total: number;
  cancellations: number;
  noShows: number;
  excusedNoShows: number;
  cancellationRate: number;
  byBarber: Record<string, RateBucket>;
  byService: Record<string, RateBucket>;
  byLocation: Record<string, RateBucket>;
  byChannel: Record<string, RateBucket>;
  byWeekday: Record<string, RateBucket>;
  byHour: Record<string, RateBucket>;
  topNoShowReasons: Array<{ reason: string; count: number }>;
  topCancellationReasons: Array<{ reason: string; count: number }>;
}

@Injectable()
export class NoShowManagementService {
  // Порт — інтерфейс, тож Nest резолвить його лише через явний токен
  // (emitDecoratorMetadata стирає тип до Object).
  constructor(
    @Inject(CANCELLATION_REASON_REPOSITORY)
    private readonly repository: CancellationReasonRepository
  ) {}

  /** Скасування фіксується лише з причиною (T-4560). */
  async cancel(input: CancellationInput): Promise<ReasonedEvent> {
    const reason = parseCancellationReason({ reason: input.reason, custom: input.custom });
    return this.record({
      ...bookingRefOf(input),
      kind: 'cancellation',
      reason: reason.reason,
      ...(reason.custom ? { custom: reason.custom } : {}),
      excused: false,
    });
  }

  /** No-show: причина опційна, статус «excused» ставить адмін. */
  async markNoShow(input: NoShowInput): Promise<ReasonedEvent> {
    const reason = parseNoShowReason({ reason: input.reason, custom: input.custom });
    return this.record({
      ...bookingRefOf(input),
      kind: 'no_show',
      reason: null,
      ...(reason?.custom ? { custom: reason.custom } : {}),
      ...(reason ? { noShowReason: reason.reason } : {}),
      excused: input.excused ?? false,
    });
  }

  /**
   * Ручний override: «excused no-show» не рахується у статистиці. Повторний
   * виклик не пише новий рядок в append-only журнал (ідемпотентність дії).
   */
  async excuse(appointmentId: string, at: Date = new Date()): Promise<ReasonedEvent> {
    const events = await this.repository.list();
    const target = events.find(
      (event) => event.appointmentId === appointmentId && event.kind === 'no_show'
    );
    if (!target) throw new ReasonedEventNotFoundError(`No-show ${appointmentId} not found`);
    if (target.excused) return target;
    const excused: ReasonedEvent = { ...target, excused: true, recordedAt: at };
    await this.repository.save(excused);
    return excused;
  }

  async events(): Promise<ReasonedEvent[]> {
    return this.repository.list();
  }

  /** Дашборд: розрізи по барберу/послузі/локації/каналу/дню тижня/годині. */
  async stats(): Promise<ReasonedStats> {
    const events = await this.repository.list();
    const counted = dedupe(events);
    const noShows = counted.filter((event) => event.kind === 'no_show');

    return {
      total: counted.length,
      cancellations: counted.filter((event) => event.kind === 'cancellation').length,
      noShows: noShows.filter((event) => !event.excused).length,
      excusedNoShows: noShows.filter((event) => event.excused).length,
      cancellationRate: cancellationRate(counted),
      byBarber: groupNoShowRates(counted, (event) => event.barberId),
      byService: groupNoShowRates(counted, (event) => event.serviceId ?? 'unknown'),
      byLocation: groupNoShowRates(counted, (event) => event.locationId),
      byChannel: groupNoShowRates(counted, (event) => event.channel),
      byWeekday: groupNoShowRates(counted, (event) => weekdayOf(event.start)),
      byHour: groupNoShowRates(counted, (event) => hourOf(event.start)),
      topNoShowReasons: topReasons(counted, 'no_show'),
      topCancellationReasons: topReasons(counted, 'cancellation'),
    };
  }

  /** Експорт для бухгалтерії/аналітики (CSV). */
  async csv(): Promise<string> {
    return toReasonedEventsCsv(dedupe(await this.repository.list()));
  }

  private async record(input: {
    appointmentId: string;
    clientId: string;
    barberId: string;
    serviceId?: string | null;
    locationId: string;
    channel: BookingChannel;
    start: Date;
    cancelledBy: CancellationActor;
    kind: 'cancellation' | 'no_show';
    reason: CancellationReason | null;
    custom?: string;
    noShowReason?: NoShowReason;
    excused: boolean;
    at?: Date;
  }): Promise<ReasonedEvent> {
    const event: ReasonedEvent = {
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      barberId: input.barberId,
      serviceId: input.serviceId ?? null,
      locationId: input.locationId,
      channel: input.channel,
      start: input.start,
      kind: input.kind,
      cancelledBy: input.cancelledBy,
      reason: input.reason,
      excused: input.excused,
      recordedAt: input.at ?? new Date(),
    };
    if (input.custom) event.custom = input.custom;
    if (input.noShowReason) event.noShowReason = input.noShowReason;
    await this.repository.save(event);
    return event;
  }
}

/** Явні поля візиту: `unsigned`-поля вхідного DTO не протікають у запис. */
function bookingRefOf(input: BookingRef): {
  appointmentId: string;
  clientId: string;
  barberId: string;
  serviceId: string | null;
  locationId: string;
  channel: BookingChannel;
  start: Date;
  cancelledBy: CancellationActor;
  at?: Date;
} {
  return {
    appointmentId: input.appointmentId,
    clientId: input.clientId,
    barberId: input.barberId,
    serviceId: input.serviceId ?? null,
    locationId: input.locationId,
    channel: input.channel,
    start: input.start,
    cancelledBy: input.cancelledBy,
    ...(input.at ? { at: input.at } : {}),
  };
}

/** Остання фіксація на візит переважає: excuse не дублює рядок у звітах. */
function dedupe(events: ReasonedEvent[]): ReasonedEvent[] {
  const byAppointment = new Map<string, ReasonedEvent>();
  for (const event of events) {
    const key = `${event.appointmentId}:${event.kind}`;
    byAppointment.set(key, event);
  }
  return [...byAppointment.values()];
}
