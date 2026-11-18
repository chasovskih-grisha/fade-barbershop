import type { Request } from 'express';
import { AppointmentNotFoundError } from '../application/appointment-lifecycle.use-case';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { webClientId } from './client-web-session';

/** Сесія клієнта і його власний візит. Чужий id — 404, не 403 (не підтверджуємо існування). */
export async function requireOwnAppointment(
  prisma: PrismaService,
  req: Request,
  appointmentId: string
): Promise<string> {
  const userId = await webClientId(req, prisma, true);
  const row = await prisma.booking.findFirst({
    where: { clientId: userId, OR: [{ appointmentId }, { id: appointmentId }] },
    select: { id: true },
  });
  if (!row) throw new AppointmentNotFoundError(appointmentId);
  return userId;
}
