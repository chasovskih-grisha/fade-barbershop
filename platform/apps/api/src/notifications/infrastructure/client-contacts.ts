// Контакти клієнта для SMS-каналу (розширення T-4608): подія booked несе
// лише appointmentId — телефон резолвиться Booking.clientId → User.phone.
// clientId — контекстне посилання на identity (User.id, без FK —
// bounded-contexts), тож лукап двохетапний. null — SMS нема кому слати
// (гість без сесії, walk-in або адмінський запис без клієнта).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface ClientContacts {
  /** Телефон клієнта запису (+380…); null — запис без клієнта. */
  findPhoneByAppointmentId(appointmentId: string): Promise<string | null>;
  /** Телефон клієнта за id користувача; null — користувача немає. */
  findPhoneByClientId(clientId: string): Promise<string | null>;
  /** ID клієнта за ID запису або booking; null — без клієнта. */
  findClientIdByAppointmentId(appointmentId: string): Promise<string | null>;
}

@Injectable()
export class PrismaClientContacts implements ClientContacts {
  constructor(private readonly prisma: PrismaService) {}

  async findPhoneByAppointmentId(appointmentId: string): Promise<string | null> {
    // Агрегат Appointment живе на рядку Booking (T-042a): appointmentId або
    // сам bookingId ідентифікують рядок (див. prisma-appointment-time-mover).
    const booking = await this.prisma.booking.findFirst({
      where: { OR: [{ appointmentId }, { id: appointmentId }] },
      select: { clientId: true },
    });
    if (!booking?.clientId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: booking.clientId },
      select: { phone: true },
    });
    return user?.phone ?? null;
  }

  async findPhoneByClientId(clientId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { phone: true },
    });
    return user?.phone ?? null;
  }

  async findClientIdByAppointmentId(appointmentId: string): Promise<string | null> {
    const booking = await this.prisma.booking.findFirst({
      where: { OR: [{ appointmentId }, { id: appointmentId }] },
      select: { clientId: true },
    });
    return booking?.clientId ?? null;
  }
}
