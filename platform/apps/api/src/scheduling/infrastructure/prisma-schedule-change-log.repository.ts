// T-230: durable журнал змін графіка (SCH-006/007). Пишеться тією самою
// транзакцією, що й AvailabilityWindow, через currentDb().
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AvailabilityWindowData } from '../domain/availability';
import type { ScheduleChange } from '../domain/schedule-change-log';
import type { ScheduleChangeLogRepository } from '../domain/ports';

type Row = {
  id: string;
  barberId: string;
  locationId: string;
  source: string;
  changedBy: string;
  occurredAt: Date;
  previous: Prisma.JsonValue;
  next: Prisma.JsonValue;
};

@Injectable()
export class PrismaScheduleChangeLogRepository implements ScheduleChangeLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async append(change: ScheduleChange): Promise<void> {
    await this.db().scheduleChangeLog.create({
      data: {
        id: uuidv7(),
        barberId: change.barberId,
        locationId: change.locationId,
        source: change.source,
        changedBy: change.changedBy,
        occurredAt: change.occurredAt,
        previous: change.previous as unknown as Prisma.InputJsonValue,
        next: change.next as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async listByBarber(barberId: string): Promise<ScheduleChange[]> {
    const rows = await this.db().scheduleChangeLog.findMany({
      where: { barberId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map(toChange);
  }

  async listAll(): Promise<ScheduleChange[]> {
    const rows = await this.db().scheduleChangeLog.findMany({
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map(toChange);
  }
}

function toChange(row: Row): ScheduleChange {
  return {
    barberId: row.barberId,
    locationId: row.locationId,
    source: row.source === 'barber' ? 'barber' : 'admin',
    changedBy: row.changedBy,
    occurredAt: row.occurredAt,
    previous: row.previous as unknown as AvailabilityWindowData[],
    next: row.next as unknown as AvailabilityWindowData[],
  };
}
