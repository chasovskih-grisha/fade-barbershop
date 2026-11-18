import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Booking, BookingConflictError, type BookingSource } from '../domain/booking';
import { BookingRepository } from '../domain/booking-repository';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { persistBookingWithCapacity } from './prisma-booking.repository.persist';
import { depositOf, discountsOf } from './booking-row-mappers';

/** Prisma implementation of BookingRepository */
@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaService = new PrismaService()) {}
  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async save(booking: Booking): Promise<void> {
    const persist = (tx: Prisma.TransactionClient) => persistBookingWithCapacity(tx, booking);
    try {
      const tx = currentDb();
      if (tx) await persist(tx);
      else await this.prisma.$transaction(persist, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error instanceof BookingConflictError) throw error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new BookingConflictError('Booking conflict; refresh available slots and retry');
      }
      throw error;
    }
  }

  async findOverlaps(locationId: string, start: Date, end: Date): Promise<Booking[]> {
    const rows = await this.db().booking.findMany({
      where: { locationId, start: { lt: end }, end: { gt: start } },
    });
    return rows.map((row) => this.restore(row));
  }

  async findAllOverlaps(start: Date, end: Date): Promise<Booking[]> {
    const rows = await this.db().booking.findMany({
      where: { start: { lt: end }, end: { gt: start } },
    });
    return rows.map((row) => this.restore(row));
  }

  async findForBarberAtLocation(barberId: string, locationId: string): Promise<Booking[]> {
    const rows = await this.db().booking.findMany({
      where: { barberId, locationId, start: { gte: new Date() } },
    });
    return rows.map((row) => this.restore(row));
  }

  async findBarberOverlaps(query: {
    barberId: string;
    locationId: string;
    start: Date;
    end: Date;
  }): Promise<Booking[]> {
    const { barberId, start, end } = query;
    const rows = await this.db().booking.findMany({
      where: { barberId, start: { lt: end }, end: { gt: start } },
    });
    return rows.map((row) => this.restore(row));
  }

  // prettier-ignore
  private restore(row: {
    id: string; barberId: string; locationId: string; serviceId: string | null; agreedPrice: number | null; agreedDuration: number | null;
    appliedDiscounts: Prisma.JsonValue | null; finalPrice: number | null;
    fulfillmentMode: string | null; start: Date; end: Date; version: number; haircutReferenceId: string | null; appointmentComment: string | null;
    clientId: string | null; source: string | null;
    depositAmount: number | null; depositPercent: number | null; depositRounding: number | null;
    cancellationWindowHours: number | null;
  }): Booking {
    return Booking.reconstitute({
      id: row.id,
      barberId: row.barberId,
      locationId: row.locationId,
      serviceId: row.serviceId,
      agreedPrice: row.agreedPrice,
      appliedDiscounts: discountsOf(row.appliedDiscounts),
      finalPrice: row.finalPrice,
      agreedDuration: row.agreedDuration,
      fulfillmentMode: row.fulfillmentMode as 'sequential' | 'parallel' | null,
      start: row.start,
      end: row.end,
      version: row.version,
      haircutReferenceId: row.haircutReferenceId,
      appointmentComment: row.appointmentComment,
      clientId: row.clientId,
      source: row.source as BookingSource,
      deposit: depositOf(row),
    });
  }
}
