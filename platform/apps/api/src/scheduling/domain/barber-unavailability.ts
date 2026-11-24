/* eslint-disable max-lines -- T-4616a: cohesive unavailability/conflict domain value objects and invariants. */
// T-4616a: недоступність барбера та конфлікти візитів. Домен без Nest/Prisma:
// маркування інтервалу не змінює жодного візиту; конфлікт — окремий запис на
// один візит, який закривається лише явним рішенням адміністратора.

export type ShiftConflictStatus = 'open' | 'closed';
export type ShiftConflictResolution = 'reassigned' | 'cancelled';

export interface BarberUnavailabilityData {
  id: string;
  barberId: string;
  /** null — недоступність у всіх локаціях барбера. */
  locationId: string | null;
  start: Date;
  end: Date;
  reason?: string;
  createdBy: string;
  createdAt: Date;
}

export interface ShiftConflictData {
  id: string;
  appointmentId: string;
  bookingId: string;
  barberId: string;
  locationId: string;
  clientId: string | null;
  serviceId: string | null;
  start: Date;
  end: Date;
  status: ShiftConflictStatus;
  resolution: ShiftConflictResolution | null;
  resolvedBarberId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface VisitRow {
  bookingId: string;
  appointmentId: string;
  barberId: string;
  locationId: string;
  clientId: string | null;
  serviceId: string | null;
  start: Date;
  end: Date;
  status: string | null;
}

export class InvalidUnavailabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUnavailabilityError';
  }
}

export function assertAvailabilityInterval(start: Date, end: Date): void {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new InvalidUnavailabilityError('A valid unavailability interval is required');
  }
  if (end <= start) {
    throw new InvalidUnavailabilityError('Unavailability end must be after start');
  }
}

/** Візит перетинає інтервал, якщо почався до його кінця і закінчився після початку. */
export function intersects(
  visit: Pick<VisitRow, 'start' | 'end'>,
  interval: { start: Date; end: Date }
): boolean {
  return visit.start < interval.end && visit.end > interval.start;
}

/** Візити, які вже завершились або скасовані, не стають конфліктами. */
export function isActionableVisit(status: string | null): boolean {
  return status === null || !['completed', 'cancelled', 'no_show'].includes(status);
}

export function openConflict(input: {
  id: string;
  visit: VisitRow;
  createdAt: Date;
}): ShiftConflictData {
  const { visit } = input;
  return {
    id: input.id,
    appointmentId: visit.appointmentId,
    bookingId: visit.bookingId,
    barberId: visit.barberId,
    locationId: visit.locationId,
    clientId: visit.clientId,
    serviceId: visit.serviceId,
    start: visit.start,
    end: visit.end,
    status: 'open',
    resolution: null,
    resolvedBarberId: null,
    resolvedAt: null,
    createdAt: input.createdAt,
  };
}

/** Повторне закриття вже закритого конфлікту не змінює рішення. */
export function closeConflict(
  conflict: ShiftConflictData,
  input: {
    resolution: ShiftConflictResolution;
    resolvedBarberId?: string;
    at: Date;
  }
): ShiftConflictData {
  if (conflict.status === 'closed') return conflict;
  return {
    ...conflict,
    status: 'closed',
    resolution: input.resolution,
    resolvedBarberId: input.resolvedBarberId ?? null,
    resolvedAt: input.at,
  };
}

export function canReassignConflict(conflict: ShiftConflictData): boolean {
  return conflict.status === 'open';
}
