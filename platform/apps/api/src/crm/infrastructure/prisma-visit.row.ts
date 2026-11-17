// Row-типи Prisma і мапери Visit ↔ рядок (crm, T-061). Ізольовано в окремому
// файлі: репозиторій читається як порт-адаптер, мапінг — як механіка.
import type { Prisma } from '@prisma/client';
import type { Visit, VisitStatus } from '../domain/visit';

export interface PrVisit {
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  locationId: string | null;
  status: string;
  start: string | null;
  end: string | null;
  occurredAt: Date;
}

export function toDomainVisit(row: PrVisit): Visit {
  return {
    appointmentId: row.appointmentId,
    clientId: row.clientId,
    barberId: row.barberId,
    locationId: row.locationId,
    status: row.status as VisitStatus,
    start: row.start,
    end: row.end,
    occurredAt: row.occurredAt,
  };
}

export function toPrismaVisit(visit: Visit): Prisma.VisitUncheckedCreateInput {
  return {
    appointmentId: visit.appointmentId,
    clientId: visit.clientId,
    barberId: visit.barberId,
    locationId: visit.locationId,
    status: visit.status,
    start: visit.start,
    end: visit.end,
    occurredAt: visit.occurredAt,
  };
}
