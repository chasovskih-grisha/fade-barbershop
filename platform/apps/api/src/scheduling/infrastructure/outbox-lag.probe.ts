// Лаг outbox (T-042c моніторинг): вік і кількість невідправлених подій.
// Живиться в /health (outbox-health.contributor) і /metrics; не залежить від
// проекції AppointmentActivity — окремий read-only запит.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OutboxLagProbe {
  constructor(private readonly prisma: PrismaService) {}

  async lag(): Promise<{ pending: number; oldestPendingMs: number | null }> {
    const rows = await this.prisma.outboxMessage.findMany({
      where: { publishedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const now = Date.now();
    const oldest = rows[0]?.createdAt;
    return {
      pending: rows.length,
      oldestPendingMs: oldest ? now - oldest.getTime() : null,
    };
  }
}
