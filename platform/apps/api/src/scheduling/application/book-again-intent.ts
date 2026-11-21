// Намір повторного запису (T-4617a): за id завершеного власного візиту
// повертає локацію, послугу й барбера для передзаповнення флоу та поточну
// ціну локації. Нічого не створює і не тримає слот. Чужий, невідомий або
// незавершений візит — відмова (клієнт не читає чужі записи, ADR 0005).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';

export interface BookAgainRef {
  id: string;
  name: string;
  /** true — об'єкт більше не дійсний для нового запису (крок відкриється звичайно). */
  stale: boolean;
}

export interface BookAgainIntent {
  location: BookAgainRef;
  service: BookAgainRef | null;
  barber: BookAgainRef;
  /** Поточна ціна локації; null — ціни немає (поле порожнє, не вигадане число). */
  price: number | null;
}

@Injectable()
export class BookAgainIntentReader {
  constructor(private readonly prisma: PrismaService) {}

  async handle(appointmentId: string, clientId: string): Promise<BookAgainIntent> {
    const row = await this.ownCompleted(appointmentId, clientId);
    // Партія (father-and-son): флоу ще не вміє передзаповнення пакета, тож
    // повторний запис із неї не починається — половина пари не створюється.
    if (row.partyId !== null) throw new AppointmentNotFoundError(appointmentId);
    const price = await this.priceRow(row.serviceId, row.locationId);
    const [location, service, barber] = await Promise.all([
      this.location(row.locationId),
      this.service(row.serviceId, Boolean(price && price.active)),
      this.barber(row.barberId, row.locationId),
    ]);
    return { location, service, barber, price: price && price.active ? price.amount : null };
  }

  private async ownCompleted(appointmentId: string, clientId: string) {
    const row = await this.prisma.booking.findFirst({
      where: { clientId, OR: [{ appointmentId }, { id: appointmentId }] },
      select: {
        barberId: true,
        locationId: true,
        serviceId: true,
        status: true,
        partyId: true,
      },
    });
    if (!row || row.status !== 'completed') throw new AppointmentNotFoundError(appointmentId);
    return row;
  }

  private async location(id: string): Promise<BookAgainRef> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: { id: true, name: true, active: true },
    });
    if (!location) throw new AppointmentNotFoundError(id);
    return { id: location.id, name: location.name, stale: !location.active };
  }

  private async service(serviceId: string | null, priced: boolean): Promise<BookAgainRef | null> {
    if (!serviceId) return null;
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true, active: true },
    });
    if (!service) return { id: serviceId, name: '', stale: true };
    return { id: service.id, name: service.name, stale: !service.active || !priced };
  }

  private async barber(barberId: string, locationId: string): Promise<BookAgainRef> {
    const [barber, assigned] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: barberId },
        select: { id: true, name: true, active: true, role: true },
      }),
      this.prisma.staffAssignment.findUnique({
        where: { barberId_locationId: { barberId, locationId } },
        select: { id: true },
      }),
    ]);
    if (!barber) return { id: barberId, name: '', stale: true };
    const eligible = barber.active && barber.role === 'barber' && Boolean(assigned);
    return { id: barber.id, name: barber.name ?? '', stale: !eligible };
  }

  private priceRow(serviceId: string | null, locationId: string) {
    if (!serviceId) return Promise.resolve(null);
    return this.prisma.servicePrice.findUnique({
      where: { serviceId_locationId: { serviceId, locationId } },
      select: { amount: true, active: true },
    });
  }
}
