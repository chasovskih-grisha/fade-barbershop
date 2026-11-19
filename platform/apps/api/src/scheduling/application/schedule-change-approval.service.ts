// T-4458: погодження зміни графіка — застосунковий шар.
// Правила — у domain/schedule-change-request.ts; тут порт сховища, перевірка
// зайнятості слота в момент згоди й подія перенесення (T-042).
//
// Сховище in-memory: у `prisma/schema.prisma` немає таблиці заявок на зміну
// часу. Порт `ScheduleChangeRepository` готовий прийняти Prisma-адаптер.
// Подія пишеться в наданий порт `ScheduleChangeEvents` (outbox) — саме вона
// ідемпотентна за `eventId`.
import { Inject, Injectable } from '@nestjs/common';
import {
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

/** Годинник заявок: інжектується, щоб hold і прострочення були детерміновані. */
export interface ScheduleChangeClock {
  now(): Date;
}

export interface ScheduleChangeRepository {
  findById(id: string): Promise<ScheduleChangeRequest | null>;
  save(request: ScheduleChangeRequest): Promise<void>;
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

  async list(): Promise<ScheduleChangeRequest[]> {
    return [...this.requests.values()];
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
    private readonly clock: ScheduleChangeClock
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
        throw new Error('Proposed slot is no longer available');
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
    if (result.event) {
      await this.events.append(result.event);
      await this.repository.save(result.request);
    }

    return {
      request: toView(result.request, at),
      alreadyConfirmed: result.alreadyConfirmed,
      eventEmitted: result.event !== null,
    };
  }

  private async require(id: string): Promise<ScheduleChangeRequest> {
    const request = await this.repository.findById(id);
    if (!request) throw new Error(`Schedule change request ${id} not found`);
    return request;
  }
}
