// Prisma-адаптер AppointmentHistory (T-4534): читає та записує історію статусів
// з таблиці Prisma. Використовує findFirst через унікачне where з nullable
// колонками — Prisma унікаjne where відсіче null-значення.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';

@Injectable()
export class PrismaAppointmentHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async create(appointmentId: string, fromStatus: string | null, toStatus: string, actorId: string | null, actorRole: string | null, reason: string | null, occurredAt: Date, sourceEventId: string): Promise<void> {
    const db = this.db();
    const data = {
      id: uuidv7(),
      appointmentId,
      fromStatus,
      toStatus,
      actorId,
      actorRole,
      reason,
      occurredAt,
      sourceEventId,
    };
    await db.appointmentHistory.create({ data });
  }

  async findByAppointmentId(
    appointmentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Array<{ appointmentId: string; fromStatus: string | null; toStatus: string; actorId: string | null; actorRole: string | null; reason: string | null; occurredAt: Date; sourceEventId: string }>; total: number }> {
    const db = this.db();
    const where = { appointmentId };

    const [rows, total] = await Promise.all([
      db.appointmentHistory.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        ...(options?.limit && { take: options.limit }),
        ...(options?.offset && { skip: options.offset }),
      }),
      db.appointmentHistory.count({ where }),
    ]);

    const items = rows.map((row) => ({
      appointmentId: row.appointmentId,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      actorId: row.actorId,
      actorRole: row.actorRole,
      reason: row.reason,
      occurredAt: row.occurredAt,
      sourceEventId: row.sourceEventId,
    }));

    return { items, total };
  }

  async findLastByAppointmentId(appointmentId: string): Promise<{ appointmentId: string; fromStatus: string | null; toStatus: string; actorId: string | null; actorRole: string | null; reason: string | null; occurredAt: Date; sourceEventId: string } | null> {
    const db = this.db();
    const row = await db.appointmentHistory.findFirst({
      where: { appointmentId },
      orderBy: { occurredAt: 'desc' },
    });

    if (!row) return null;

    return {
      appointmentId: row.appointmentId,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      actorId: row.actorId,
      actorRole: row.actorRole,
      reason: row.reason,
      occurredAt: row.occurredAt,
      sourceEventId: row.sourceEventId,
    };
  }
}