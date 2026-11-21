/* eslint-disable max-lines, complexity -- cohesive module (246 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: approveRequest, complexity 11 vs 10); refactor tracked in T-2500f */
/**
 * T-4458: погодження зміни графіка (per location) — чиста політика.
 *
 * Клієнт просить новий час (T-230), оператор підтверджує або відхиляє
 * (з альтернативою), клієнт погоджується → запис переноситься (T-042).
 *
 * Правила:
 *  - рішення оператора ухвалюється лише для заявки в стані `requested`
 *    (повторне «підтвердити» не переписує вже ухвалене рішення);
 *  - схвалення тримає слот `PROPOSAL_WINDOW_MINUTES`, після чого пропозиція
 *    прострочується й потрібне нове рішення;
 *  - згода клієнта **ідемпотентна** за `eventId`: повторний виклик з тим самим
 *    id не створює другої події перенесення (at-least-once доставка);
 *  - під час вікна згоди слот міг зайняти хтось інший: доступність
 *    перевіряється на момент згоди, а не лише на момент схвалення.
 */

export type ScheduleChangeStatus = 'requested' | 'approved' | 'rejected' | 'expired' | 'confirmed';

/** Дата `YYYY-MM-DD` + локальний час `HH:MM` (Europe/Kyiv). */
export interface SlotRef {
  date: string;
  start: string;
  end: string;
}

export interface Proposal {
  slot: SlotRef;
  by: string;
  at: Date;
  expiresAt: Date;
}

export interface Rejection {
  by: string;
  reason: string;
  at: Date;
  alternativeSlot?: SlotRef;
}

export interface ClientAgreement {
  clientId: string;
  at: Date;
  /** Ключ ідемпотентності події перенесення. */
  eventId: string;
}

export interface ScheduleChangeRequest {
  id: string;
  appointmentId: string;
  clientId: string;
  /** Поточний слот запису на момент заявки. */
  currentSlot: SlotRef;
  /** Що просить клієнт; без значення — «будь-який час у вікні». */
  requestedSlot?: SlotRef;
  status: ScheduleChangeStatus;
  requestedAt: Date;
  proposal?: Proposal;
  rejection?: Rejection;
  agreement?: ClientAgreement;
}

export const PROPOSAL_WINDOW_MINUTES = 120;

export class ScheduleChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleChangeError';
  }
}

export class ScheduleChangeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleChangeConflictError';
  }
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Перевірка форми слота: дата, час і порядок start < end. */
export function validateSlot(slot: SlotRef): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) errors.push('Slot date must be YYYY-MM-DD');
  if (!isValidTime(slot.start)) errors.push('Slot start must be HH:MM');
  if (!isValidTime(slot.end)) errors.push('Slot end must be HH:MM');
  if (isValidTime(slot.start) && isValidTime(slot.end) && slot.end <= slot.start) {
    errors.push('Slot end must be after start');
  }
  return errors;
}

export function sameSlot(a: SlotRef, b: SlotRef): boolean {
  return a.date === b.date && a.start === b.start && a.end === b.end;
}

/** Пропозиція має бути в межах вікна запису й не в минулому. */
export function validateProposalWindow(
  slot: SlotRef,
  input: { now: Date; bookingWindowDays: number }
): string[] {
  const errors = validateSlot(slot);
  if (errors.length > 0) return errors;

  if (Number.isNaN(Date.parse(`${slot.date}T00:00:00Z`))) {
    return [...errors, 'Slot date is not a valid calendar date'];
  }

  // Вікно запису рахуємо днями (дата проти дати): перевірка не залежить від
  // поясу й не чутлива до часу доби, тож результат детермінований.
  const dayKey = (value: Date): string => value.toISOString().slice(0, 10);
  const todayKey = dayKey(input.now);
  const windowEndKey = dayKey(
    new Date(input.now.getTime() + input.bookingWindowDays * 24 * 60 * 60 * 1000)
  );

  if (slot.date < todayKey) errors.push('Proposed slot is in the past');
  if (slot.date > windowEndKey) {
    errors.push(`Proposed slot is beyond the ${input.bookingWindowDays}-day booking window`);
  }
  return errors;
}

/** Клієнт відкриває заявку на зміну часу. */
export function openChangeRequest(input: {
  id: string;
  appointmentId: string;
  clientId: string;
  currentSlot: SlotRef;
  requestedSlot?: SlotRef;
  at?: Date;
}): ScheduleChangeRequest {
  const currentErrors = validateSlot(input.currentSlot);
  if (currentErrors.length > 0) throw new ScheduleChangeError(currentErrors.join('; '));

  if (input.requestedSlot) {
    const requestedErrors = validateSlot(input.requestedSlot);
    if (requestedErrors.length > 0) throw new ScheduleChangeError(requestedErrors.join('; '));
    if (sameSlot(input.currentSlot, input.requestedSlot)) {
      throw new ScheduleChangeConflictError('Requested slot is already the appointment slot');
    }
  }

  const request: ScheduleChangeRequest = {
    id: input.id,
    appointmentId: input.appointmentId,
    clientId: input.clientId,
    currentSlot: input.currentSlot,
    status: 'requested',
    requestedAt: input.at ?? new Date(),
  };
  if (input.requestedSlot) request.requestedSlot = input.requestedSlot;
  return request;
}

/** Прострочена пропозиція більше не приймає згоду. */
export function proposalExpired(request: ScheduleChangeRequest, now: Date = new Date()): boolean {
  if (request.status !== 'approved' || !request.proposal) return false;
  return request.proposal.expiresAt.getTime() <= now.getTime();
}

/** Стан заявки з урахуванням часу (для списків і планувальника). */
export function effectiveStatus(
  request: ScheduleChangeRequest,
  now: Date = new Date()
): ScheduleChangeStatus {
  if (proposalExpired(request, now)) return 'expired';
  return request.status;
}

/**
 * Оператор схвалює заявку й пропонує слот (свій або клієнтський).
 * Слоти перевіряються на вікно запису; зайнятість перевіряє застосунок.
 */
export function approveRequest(
  request: ScheduleChangeRequest,
  input: {
    by: string;
    slot?: SlotRef;
    at?: Date;
    windowMinutes?: number;
    bookingWindowDays?: number;
  }
): ScheduleChangeRequest {
  if (request.status !== 'requested') {
    throw new ScheduleChangeConflictError(
      `Only a requested change can be approved (current: ${request.status})`
    );
  }
  if (!input.by.trim()) throw new ScheduleChangeError('Approval requires an operator id');

  const slot = input.slot ?? request.requestedSlot;
  if (!slot) throw new ScheduleChangeError('Approval requires a proposed slot');

  const errors = validateProposalWindow(slot, {
    now: input.at ?? new Date(),
    bookingWindowDays: input.bookingWindowDays ?? 60,
  });
  if (errors.length > 0) throw new ScheduleChangeError(errors.join('; '));
  if (sameSlot(slot, request.currentSlot)) {
    throw new ScheduleChangeConflictError('Proposed slot equals the current appointment slot');
  }

  const at = input.at ?? new Date();
  return {
    ...request,
    status: 'approved',
    proposal: {
      slot,
      by: input.by,
      at,
      expiresAt: new Date(at.getTime() + (input.windowMinutes ?? PROPOSAL_WINDOW_MINUTES) * 60_000),
    },
  };
}

/** Оператор відхиляє заявку, за потреби — з альтернативним слотом. */
export function rejectRequest(
  request: ScheduleChangeRequest,
  input: { by: string; reason: string; alternativeSlot?: SlotRef; at?: Date }
): ScheduleChangeRequest {
  if (request.status !== 'requested') {
    throw new ScheduleChangeConflictError(
      `Only a requested change can be rejected (current: ${request.status})`
    );
  }
  if (!input.by.trim()) throw new ScheduleChangeError('Rejection requires an operator id');
  if (!input.reason.trim()) throw new ScheduleChangeError('Rejection requires a reason');

  if (input.alternativeSlot) {
    const errors = validateSlot(input.alternativeSlot);
    if (errors.length > 0) throw new ScheduleChangeError(errors.join('; '));
  }

  const rejection: Rejection = {
    by: input.by,
    reason: input.reason.trim(),
    at: input.at ?? new Date(),
  };
  if (input.alternativeSlot) rejection.alternativeSlot = input.alternativeSlot;

  return { ...request, status: 'rejected', rejection };
}

export interface ScheduleChangeConfirmedEvent {
  type: 'scheduling.appointment.change_confirmed';
  payload: {
    requestId: string;
    appointmentId: string;
    clientId: string;
    eventId: string;
    from: SlotRef;
    to: SlotRef;
  };
}

/**
 * Згода клієнта: фіксується один раз і породжує рівно одну подію перенесення.
 * Повтор з тим самим `eventId` — не помилка й не друга подія.
 */
export function confirmAgreement(
  request: ScheduleChangeRequest,
  input: { clientId: string; eventId: string; at?: Date; slotTaken?: boolean }
): {
  request: ScheduleChangeRequest;
  event: ScheduleChangeConfirmedEvent | null;
  alreadyConfirmed: boolean;
} {
  if (input.clientId !== request.clientId) {
    throw new ScheduleChangeError('Only the requesting client can confirm the change');
  }
  if (!input.eventId.trim()) throw new ScheduleChangeError('Confirmation requires an event id');

  if (request.agreement?.eventId === input.eventId) {
    return { request, event: null, alreadyConfirmed: true };
  }
  if (request.agreement) {
    throw new ScheduleChangeConflictError('Change request is already confirmed');
  }
  if (request.status !== 'approved' || !request.proposal) {
    throw new ScheduleChangeConflictError(
      `Only an approved change can be confirmed (current: ${request.status})`
    );
  }

  const at = input.at ?? new Date();
  if (proposalExpired(request, at)) {
    throw new ScheduleChangeError('Proposal expired before the client confirmed');
  }
  if (input.slotTaken) {
    throw new ScheduleChangeConflictError('Proposed slot is no longer available');
  }

  const confirmed: ScheduleChangeRequest = {
    ...request,
    status: 'confirmed',
    agreement: { clientId: input.clientId, at, eventId: input.eventId },
  };

  return {
    request: confirmed,
    event: {
      type: 'scheduling.appointment.change_confirmed',
      payload: {
        requestId: request.id,
        appointmentId: request.appointmentId,
        clientId: request.clientId,
        eventId: input.eventId,
        from: request.currentSlot,
        to: request.proposal.slot,
      },
    },
    alreadyConfirmed: false,
  };
}
