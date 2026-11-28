// Prisma-адаптер AppointmentHistory (T-4534): читає та записує історію статусів
// з таблиці Prisma. Використовує findFirst через унікачне where з nullable
// колонками — Prisma унікальне where відсіче null-значення.

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';

/** Рядок історії статусів візиту. */
export interface AppointmentHistoryRecord {
  appointmentId: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string | null;
  actorRole: string | null;
  reason: string | null;
  occurredAt: Date;
  sourceEventId: string;
}

/** Новий запис історії: один обʼєкт замість восьми позиційних аргументів. */
export type NewAppointmentHistoryEntry = AppointmentHistoryRecord;

function toRecord(row: AppointmentHistoryRecord): AppointmentHistoryRecord {
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

@Injectable()
export class PrismaAppointmentHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async create(entry: NewAppointmentHistoryEntry): Promise<void> {
    const db = this.db();
    await db.appointmentHistory.create({ data: { id: uuidv7(), ...entry } });
  }

  async findByAppointmentId(
    appointmentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: AppointmentHistoryRecord[]; total: number }> {
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

    return { items: rows.map(toRecord), total };
  }

  async findLastByAppointmentId(
    appointmentId: string
  ): Promise<AppointmentHistoryRecord | null> {
    const db = this.db();
    const row = await db.appointmentHistory.findFirst({
      where: { appointmentId },
      orderBy: { occurredAt: 'desc' },
    });

    return row ? toRecord(row) : null;
  }
}
