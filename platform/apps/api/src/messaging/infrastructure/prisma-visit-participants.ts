// ACL messaging → scheduling (T-081): учасники візиту читаються з Booking.
// Розмова без клієнта або без барбера не відкривається — інакше чат «у нікуди».
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { VisitParticipantLookup, VisitParties } from '../domain/ports';

@Injectable()
export class PrismaVisitParticipants implements VisitParticipantLookup {
  constructor(private readonly prisma: PrismaService) {}

  async parties(visitId: string): Promise<VisitParties | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: visitId },
      select: { clientId: true, barberId: true },
    });
    if (!booking?.clientId || !booking.barberId) return null;
    return { clientId: booking.clientId, barberId: booking.barberId };
  }
}
