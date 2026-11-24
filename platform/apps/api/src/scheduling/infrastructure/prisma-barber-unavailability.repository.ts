// T-4616a: Prisma-адаптер недоступності. Читання майбутніх візитів бере лише
// активні Booking (completed/cancelled/no_show не стають конфліктами).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';
import type { Prisma } from '@prisma/client';
import type { BarberUnavailabilityData, VisitRow } from '../domain/barber-unavailability';
import type { BarberUnavailabilityRepository } from '../domain/shift-conflict-ports';

@Injectable()
export class PrismaBarberUnavailabilityRepository implements BarberUnavailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async save(data: BarberUnavailabilityData): Promise<void> {
    await this.db().barberUnavailability.create({
      data: {
        id: data.id,
        barberId: data.barberId,
        locationId: data.locationId ?? null,
        start: data.start,
        end: data.end,
        reason: data.reason ?? null,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
      },
    });
  }

  async covers(input: {
    barberId: string;
    locationId: string;
    start: Date;
    end: Date;
  }): Promise<boolean> {
    const found = await this.db().barberUnavailability.findFirst({
      where: {
        barberId: input.barberId,
        OR: [{ locationId: null }, { locationId: input.locationId }],
        start: { lt: input.end },
        end: { gt: input.start },
      },
      select: { id: true },
    });
    return found !== null;
  }

  async futureVisitsForBarber(input: {
    barberId: string;
    interval: { start: Date; end: Date };
    now: Date;
    locationId?: string;
  }): Promise<VisitRow[]> {
    const { barberId, interval, now, locationId } = input;
    const rows = await this.db().booking.findMany({
      where: {
        barberId,
        ...(locationId ? { locationId } : {}),
        start: { gte: now, lt: interval.end },
        end: { gt: interval.start },
        OR: [{ status: null }, { status: { notIn: ['completed', 'cancelled', 'no_show'] } }],
      },
      select: {
        id: true,
        appointmentId: true,
        partyId: true,
        barberId: true,
        locationId: true,
        clientId: true,
        serviceId: true,
        start: true,
        end: true,
        status: true,
      },
      orderBy: { start: 'asc' },
    });
    return rows.map((row) => ({
      bookingId: row.id,
      appointmentId: row.appointmentId ?? row.id,
      partyId: row.partyId,
      barberId: row.barberId,
      locationId: row.locationId,
      clientId: row.clientId,
      serviceId: row.serviceId,
      start: row.start,
      end: row.end,
      status: row.status,
    }));
  }
}
