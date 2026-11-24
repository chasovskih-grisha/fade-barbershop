/* eslint-disable max-lines, max-params -- cohesive module (179 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// T-4458: погодження зміни графіка — застосунковий шар.
// Правила — у domain/schedule-change-request.ts; тут порт сховища, перевірка
// зайнятості слота в момент згоди й подія перенесення (T-042).
//
// Durable-сховище — `PrismaScheduleChangeRepository`; in-memory реалізація
// лишається для юніт-тестів. Подія пишеться в outbox, а `agreementEventId`
// робить повторну згоду ідемпотентною.
import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  ScheduleChangeConflictError,
  approveRequest,
  confirmAgreement,
  effectiveStatus,
  openChangeRequest,
  rejectRequest,
  type ScheduleChangeConfirmedEvent,
  type ScheduleChangeRequest,
  type ScheduleChangeStatus,
  type SlotRef,
} from '../domain/schedule-change-request';

export type { ScheduleChangeConfirmedEvent } from '../domain/schedule-change-request';

export const SCHEDULE_CHANGE_REPOSITORY = 'SCHEDULE_CHANGE_REPOSITORY';
export const SCHEDULE_CHANGE_EVENTS = 'SCHEDULE_CHANGE_EVENTS';
export const SCHEDULE_CHANGE_AVAILABILITY = 'SCHEDULE_CHANGE_AVAILABILITY';
export const SCHEDULE_CHANGE_CLOCK = 'SCHEDULE_CHANGE_CLOCK';
export const SCHEDULE_CHANGE_UOW = 'SCHEDULE_CHANGE_UOW';
export const SCHEDULE_CHANGE_APPLIER = 'SCHEDULE_CHANGE_APPLIER';

/** Годинник заявок: інжектується, щоб hold і прострочення були детерміновані. */
export interface ScheduleChangeClock {
  now(): Date;
}

export interface ScheduleChangeRepository {
  findById(id: string): Promise<ScheduleChangeRequest | null>;
  save(request: ScheduleChangeRequest): Promise<void>;
  /** Атомарно закріплює згоду; false — хтось уже підтвердив/стан змінився. */
  claimConfirmation(request: ScheduleChangeRequest): Promise<boolean>;
  list(): Promise<ScheduleChangeRequest[]>;
}

export class InMemoryScheduleChangeRepository implements ScheduleChangeRepository {
  private readonly requests = new Map<string, ScheduleChangeRequest>();

  async findById(id: string): Promise<ScheduleChangeRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async save(request: ScheduleChangeRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async claimConfirmation(request: ScheduleChangeRequest): Promise<boolean> {
    const current = this.requests.get(request.id);
    if (!current || current.status !== 'approved' || current.agreement) return false;
    this.requests.set(request.id, request);
    return true;
  }

  async list(): Promise<ScheduleChangeRequest[]> {
    return [...this.requests.values()];
  }

  /** Для тестів транзакційного відкоту: знімок і відновлення in-memory стану. */
  snapshot(): Map<string, ScheduleChangeRequest> {
    return new Map(this.requests);
  }

  restore(snapshot: Map<string, ScheduleChangeRequest>): void {
    this.requests.clear();
    for (const [id, request] of snapshot) this.requests.set(id, request);
  }
}

/** Outbox для події перенесення (ідемпотентність — за `eventId`). */
export interface ScheduleChangeEvents {
  append(event: ScheduleChangeConfirmedEvent): Promise<void>;
}

/** Зайнятість слота на момент згоди (availability/booking-контур). */
export interface ScheduleChangeAvailability {
  isSlotAvailable(input: { appointmentId: string; slot: SlotRef }): Promise<boolean>;
}

/** Застосування згоди: Booking рухається через RescheduleAppointment (T-042). */
export interface ScheduleChangeApplier {
  apply(event: ScheduleChangeConfirmedEvent): Promise<void>;
}

/** Один use case = одна транзакція (outbox + заявка + перенесення). */
export interface ScheduleChangeUnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export interface ScheduleChangeView {
  id: string;
  appointmentId: string;
  clientId: string;
  status: ScheduleChangeStatus;
  requestedAt: Date;
  currentSlot: SlotRef;
  requestedSlot?: SlotRef;
  proposal?: { slot: SlotRef; expiresAt: Date };
  rejection?: { reason: string; alternativeSlot?: SlotRef };
}

function toView(request: ScheduleChangeRequest, now: Date): ScheduleChangeView {
  const view: ScheduleChangeView = {
    id: request.id,
    appointmentId: request.appointmentId,
    clientId: request.clientId,
    status: effectiveStatus(request, now),
    requestedAt: request.requestedAt,
    currentSlot: request.currentSlot,
  };
  if (request.requestedSlot) view.requestedSlot = request.requestedSlot;
  if (request.proposal) {
    view.proposal = { slot: request.proposal.slot, expiresAt: request.proposal.expiresAt };
  }
  if (request.rejection) {
    view.rejection = {
      reason: request.rejection.reason,
      ...(request.rejection.alternativeSlot
        ? { alternativeSlot: request.rejection.alternativeSlot }
        : {}),
    };
  }
  return view;
}

@Injectable()
export class ScheduleChangeApprovalService {
  constructor(
    @Inject(SCHEDULE_CHANGE_REPOSITORY)
    private readonly repository: ScheduleChangeRepository,
    @Inject(SCHEDULE_CHANGE_EVENTS)
    private readonly events: ScheduleChangeEvents,
    @Inject(SCHEDULE_CHANGE_AVAILABILITY)
    private readonly availability: ScheduleChangeAvailability,
    @Inject(SCHEDULE_CHANGE_CLOCK)
    private readonly clock: ScheduleChangeClock,
    @Optional()
    @Inject(SCHEDULE_CHANGE_UOW)
    private readonly uow?: ScheduleChangeUnitOfWork,
    @Optional()
    @Inject(SCHEDULE_CHANGE_APPLIER)
    private readonly applier?: ScheduleChangeApplier
  ) {}

  /** Заявка клієнта на інший час (T-230). */
  async request(input: {
    id: string;
    appointmentId: string;
    clientId: string;
    currentSlot: SlotRef;
    requestedSlot?: SlotRef;
    at?: Date;
  }): Promise<ScheduleChangeView> {
    const at = input.at ?? this.clock.now();
    const existing = await this.repository.findById(input.id);
    if (existing) return toView(existing, at);

    const created = openChangeRequest({ ...input, at });
    await this.repository.save(created);
    return toView(created, at);
  }

  /** Операторський список; `status` — ефективний стан з урахуванням часу. */
  async list(filter: { status?: ScheduleChangeStatus } = {}, now: Date = this.clock.now()) {
    const requests = await this.repository.list();
    return requests
      .map((request) => toView(request, now))
      .filter((view) => !filter.status || view.status === filter.status)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async get(id: string, now: Date = this.clock.now()): Promise<ScheduleChangeView> {
    return toView(await this.require(id), now);
  }

  /** Схвалення з перевіркою зайнятості запропонованого слота. */
  async approve(
    id: string,
    input: { by: string; slot?: SlotRef; at?: Date; windowMinutes?: number }
  ): Promise<ScheduleChangeView> {
    const request = await this.require(id);
    const at = input.at ?? this.clock.now();
    const draft = approveRequest(request, {
      ...input,
      at,
      bookingWindowDays: 60,
    });

    const slot = draft.proposal?.slot;
    if (slot) {
      const free = await this.availability.isSlotAvailable({
        appointmentId: request.appointmentId,
        slot,
      });
      if (!free) {
        // Не зберігаємо схвалення на зайнятий слот: заявка лишається requested.
        throw new ScheduleChangeConflictError('Proposed slot is no longer available');
      }
    }

    await this.repository.save(draft);
    return toView(draft, at);
  }

  /** Відхилення з причиною й, за потреби, альтернативою. */
  async reject(
    id: string,
    input: { by: string; reason: string; alternativeSlot?: SlotRef; at?: Date }
  ): Promise<ScheduleChangeView> {
    const request = await this.require(id);
    const at = input.at ?? this.clock.now();
    const rejected = rejectRequest(request, { ...input, at });
    await this.repository.save(rejected);
    return toView(rejected, at);
  }

  /**
   * Згода клієнта: доступність перевіряється тут, подія пишеться один раз.
   * Повторний виклик з тим самим `eventId` повертає `alreadyConfirmed: true`.
   */
  async confirm(
    id: string,
    input: { clientId: string; eventId: string; at?: Date }
  ): Promise<{ request: ScheduleChangeView; alreadyConfirmed: boolean; eventEmitted: boolean }> {
    const work = async () => {
      const request = await this.require(id);
      const at = input.at ?? this.clock.now();

      const slot = request.proposal?.slot;
      const slotTaken =
        request.status === 'approved' && slot
          ? !(await this.availability.isSlotAvailable({
              appointmentId: request.appointmentId,
              slot,
            }))
          : false;

      const result = confirmAgreement(request, { ...input, at, slotTaken });
      if (!result.event) {
        return {
          request: toView(result.request, at),
          alreadyConfirmed: true,
          eventEmitted: false,
        };
      }

      const claimed = await this.repository.claimConfirmation(result.request);
      if (!claimed) {
        const latest = await this.require(id);
        if (latest.agreement?.eventId === input.eventId) {
          return {
            request: toView(latest, at),
            alreadyConfirmed: true,
            eventEmitted: false,
          };
        }
        throw new ScheduleChangeConflictError('Change request changed before confirmation');
      }

      // Перенесення і подія — в одній транзакції зі згодою. Якщо слот уже не
      // проходить Availability/OpeningHours/конфлікт, усе відкочується.
      await this.applier?.apply(result.event);
      await this.events.append(result.event);
      return {
        request: toView(result.request, at),
        alreadyConfirmed: false,
        eventEmitted: true,
      };
    };
    return this.uow ? this.uow.run(work) : work();
  }

  private async require(id: string): Promise<ScheduleChangeRequest> {
    const request = await this.repository.findById(id);
    if (!request) throw new Error(`Schedule change request ${id} not found`);
    return request;
  }
}
