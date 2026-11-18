import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentParty } from '../domain/appointment-party.entity';
import type { AppointmentPartyRepository } from '../application/ports';
import { assertLegsFree, assertPartyCapacity, legsOf, partyCreateData, partySpan } from './appointment-party-capacity';
import { restoreAppointmentParty } from './appointment-party-row';

@Injectable()
export class PrismaAppointmentPartyRepository implements AppointmentPartyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(party: AppointmentParty): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const span = partySpan(party);
        const chairs = await tx.chair.count({
          where: { locationId: party.locationId, active: true },
        });
        if (chairs < (party.mode === 'parallel' ? 2 : 1))
          throw new Error('Not enough active chairs for party');
        const existing = await tx.booking.findMany({
          where: {
            locationId: party.locationId,
            start: { lt: span.windowEnd },
            end: { gt: span.windowStart },
          },
          select: { start: true, end: true },
        });
        assertPartyCapacity(
          existing,
          party.slots.map((slot) => ({ start: slot.start, end: slot.end })),
          chairs
        );
        const legs = legsOf(party);
        await assertLegsFree(tx, legs);
        await tx.appointmentParty.create({ data: partyCreateData(party) });
        for (const { slot, leg, partyRole } of legs) {
          if (!slot || !leg) throw new Error('Party legs and slots do not match');
          await tx.booking.create({
            data: {
              id: uuidv7(),
              barberId: leg.barberId,
              locationId: party.locationId,
              serviceId: party.serviceId,
              fulfillmentMode: party.mode,
              partyId: party.id,
              partyRole,
              start: slot.start,
              end: slot.end,
              version: 0,
            },
          });
        }
      },
      { isolationLevel: 'Serializable' }
    );
  }

  async findById(id: string): Promise<AppointmentParty | null> {
    const row = await this.prisma.appointmentParty.findUnique({ where: { id } });
    return row?.date && row.mode && row.serviceId && row.agreedPrice !== null
      ? restoreAppointmentParty(row)
      : null;
  }

  async findByDate(date: Date): Promise<AppointmentParty[]> {
    const rows = await this.prisma.appointmentParty.findMany({ where: { date } });
    return rows
      .filter((row) => row.mode && row.serviceId && row.agreedPrice !== null)
      .map((row) => restoreAppointmentParty(row));
  }
}
