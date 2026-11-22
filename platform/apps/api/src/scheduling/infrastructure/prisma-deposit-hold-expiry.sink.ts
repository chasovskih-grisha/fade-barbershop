// T-4619a: durable-ефект прострочення депозитного утримання.
//
// Один SQL-перехід: візит стає `cancelled` з причиною `deposit_expired`, і в
// outbox дописується рівно одна подія. Умовний UPDATE робить ефект
// ідемпотентним: другий sweep або пізній capture не дублює подію.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { DepositHoldExpirySink } from '../application/deposit-hold.service';

@Injectable()
export class PrismaDepositHoldExpirySink implements DepositHoldExpirySink {
  constructor(private readonly prisma: PrismaService) {}

  async expire(input: {
    appointmentId: string;
    barberId: string;
    locationId: string;
    at: Date;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: {
          id: input.appointmentId,
          OR: [
            { status: null },
            { status: { notIn: ['cancelled', 'completed', 'no_show'] } },
          ],
        },
        data: { status: 'cancelled', cancelReason: 'deposit_expired' },
      });
      if (updated.count === 0) return;

      await tx.outboxMessage.create({
        data: {
          id: uuidv7(),
          aggregateType: 'appointment',
          aggregateId: input.appointmentId,
          type: 'scheduling.appointment.cancelled',
          payload: {
            appointmentId: input.appointmentId,
            barberId: input.barberId,
            locationId: input.locationId,
            reason: 'deposit_expired',
            occurredAt: input.at.toISOString(),
          },
        },
      });
    });
  }
}
