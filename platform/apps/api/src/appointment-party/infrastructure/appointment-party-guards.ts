import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { dayOfWeekIndex } from '../../scheduling/domain/day-of-week';
import {
  CreateAppointmentPartyDto,
  LegRequest,
  openFor,
  parsePartySlot,
  withinWindow,
} from './appointment-party.dto';

export async function assertPartyReady(
  prisma: PrismaService,
  dto: CreateAppointmentPartyDto
): Promise<void> {
  const location = await prisma.location.findUnique({
    where: { id: dto.locationId },
    select: { active: true },
  });
  if (!location?.active) throw new BadRequestException('Location must be active');
  const barbers = [...new Set(dto.barberIds)];
  const users = await prisma.user.findMany({
    where: { id: { in: barbers }, role: 'barber', active: true },
    select: { id: true },
  });
  if (users.length !== barbers.length)
    throw new BadRequestException('Every party barber must be active');
  const assignments = await prisma.staffAssignment.findMany({
    where: { locationId: dto.locationId, barberId: { in: barbers } },
    select: { barberId: true },
  });
  if (new Set(assignments.map((row) => row.barberId)).size !== barbers.length)
    throw new BadRequestException('Every party barber must be assigned to this location');
  const requests =
    dto.mode === 'sequential'
      ? [{ barberId: dto.barberIds[0], slot: dto.slots[0] }]
      : dto.partyLegs.map((leg, index) => ({ barberId: leg.barberId, slot: dto.slots[index] }));
  for (const request of requests) {
    await assertLegTime(prisma, request, dto.locationId);
  }
}

async function assertLegTime(
  prisma: PrismaService,
  request: LegRequest,
  locationId: string
): Promise<void> {
  let start: Date;
  let end: Date;
  try {
    ({ start, end } = parsePartySlot(request));
  } catch (error) {
    throw new BadRequestException(error instanceof Error ? error.message : 'Invalid slot');
  }
  const dayOfWeek = dayOfWeekIndex(start);
  const windows = await prisma.availabilityWindow.findMany({
    where: { locationId, barberId: request.barberId, dayOfWeek },
  });
  if (!withinWindow(windows, start, end))
    throw new BadRequestException(
      `Barber ${request.barberId} is not available for the selected slot`
    );
  const openingHour = await prisma.openingHour.findUnique({
    where: { locationId_dayOfWeek: { locationId, dayOfWeek } },
  });
  if (!openFor(openingHour, start, end))
    throw new BadRequestException('Party slot must fit within location opening hours');
}

export function toPartyHttpError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unable to create appointment party';
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (
    /already booked|free chairs|active chairs/i.test(message) ||
    code === 'P2034' ||
    code === 'P2002'
  )
    throw new HttpException(message, HttpStatus.CONFLICT);
  if (
    /PARTY-|required|must be|invalid|exactly|positive integer|same start|one slot|two slots/i.test(
      message
    )
  )
    throw new BadRequestException(message);
  throw error;
}
