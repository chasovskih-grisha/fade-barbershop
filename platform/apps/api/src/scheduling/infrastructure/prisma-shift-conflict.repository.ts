/* eslint-disable max-lines -- T-4616a: idempotent open/conditional close in one adapter. */
// T-4616a: Prisma-сховище конфліктів. `open` ідемпотентний за bookingId, а
// `close` умовний за status=open — повторне рішення не переписує закритий рядок.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';
import type { Prisma } from '@prisma/client';
import type { ShiftConflictData } from '../domain/barber-unavailability';
import type { ShiftConflictRepository } from '../domain/shift-conflict-ports';

type Row = {
  id: string;
  appointmentId: string;
  bookingId: string;
  barberId: string;
  locationId: string;
  clientId: string | null;
  serviceId: string | null;
  start: Date;
  end: Date;
  status: string;
  resolution: string | null;
  resolvedBarberId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class PrismaShiftConflictRepository implements ShiftConflictRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async open(data: ShiftConflictData): Promise<boolean> {
    const result = await this.db().shiftConflict.createMany({
      data: [
        {
          id: data.id,
          appointmentId: data.appointmentId,
          bookingId: data.bookingId,
          barberId: data.barberId,
          locationId: data.locationId,
          clientId: data.clientId,
          serviceId: data.serviceId,
          start: data.start,
          end: data.end,
          status: data.status,
          createdAt: data.createdAt,
        },
      ],
      skipDuplicates: true,
    });
    return result.count > 0;
  }

  async findById(id: string): Promise<ShiftConflictData | null> {
    const row = await this.db().shiftConflict.findUnique({ where: { id } });
    return row ? toData(row) : null;
  }

  async listOpen(filter: {
    barberId?: string;
    locationId?: string;
  }): Promise<ShiftConflictData[]> {
    const rows = await this.db().shiftConflict.findMany({
      where: {
        status: 'open',
        ...(filter.barberId ? { barberId: filter.barberId } : {}),
        ...(filter.locationId ? { locationId: filter.locationId } : {}),
      },
      orderBy: { start: 'asc' },
    });
    return rows.map(toData);
  }

  async close(
    id: string,
    input: {
      resolution: 'reassigned' | 'cancelled';
      resolvedBarberId?: string;
      at: Date;
    }
  ): Promise<ShiftConflictData | null> {
    const persist = async (db: Prisma.TransactionClient) => {
      const updated = await db.shiftConflict.updateMany({
        where: { id, status: 'open' },
        data: {
          status: 'closed',
          resolution: input.resolution,
          resolvedBarberId: input.resolvedBarberId ?? null,
          resolvedAt: input.at,
        },
      });
      if (updated.count === 0) return null;
      const row = await db.shiftConflict.findUnique({ where: { id } });
      return row ? toData(row) : null;
    };
    const ambient = currentDb();
    return ambient
      ? persist(ambient)
      : this.prisma.$transaction(persist, { isolationLevel: 'Serializable' });
  }
}

function toData(row: Row): ShiftConflictData {
  return {
    ...row,
    status: row.status as ShiftConflictData['status'],
    resolution: row.resolution as ShiftConflictData['resolution'],
  };
}
