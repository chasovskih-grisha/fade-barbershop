// Читання повернень у `processing` (T-4616b). Поріг — `refundInitiatedAt`:
// це момент, коли T-094 записав намір повернення, тож старше за поріг означає,
// що settlement не доїхав (крах інстансу), а не нормальний хід запиту.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RefundStatus } from '../domain/refund.entity';
import type { StuckRefund, StuckRefundRepository } from '../application/reconcile-stuck-refunds.use-case';

@Injectable()
export class PrismaStuckRefunds implements StuckRefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStuck(input: { olderThan: Date; limit: number }): Promise<StuckRefund[]> {
    const rows = await this.prisma.bookingPaymentState.findMany({
      where: {
        refundStatus: RefundStatus.PROCESSING,
        refundId: { not: null },
        refundInitiatedAt: { lt: input.olderThan },
      },
      orderBy: { refundInitiatedAt: 'asc' },
      take: input.limit,
      select: { bookingId: true, refundId: true, refundInitiatedAt: true },
    });
    return rows.flatMap((row) =>
      row.refundId && row.refundInitiatedAt
        ? [
            {
              refundId: row.refundId,
              bookingId: row.bookingId,
              initiatedAt: row.refundInitiatedAt,
            },
          ]
        : []
    );
  }
}
