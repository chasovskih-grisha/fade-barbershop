// Read-модель «деталі візиту» в адмінці (admin-screens §5.2): одна сторінка
// з усією доступною інформацією про запис — довідники (послуга, локація,
// барбер, клієнт, партія) + журнал подій outbox і сповіщень. Стиль
// AdminCalendar/list-client-appointments: Prisma напряму, read-side без
// доменного порта; статус живе на рядку Booking.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { loadBookingJournal } from './admin-booking-detail.journal';
import { mapBookingRow, mapParty } from './admin-booking-detail.map';
import type { BookingDetail } from './admin-booking-detail.view';

export type { BookingDetail } from './admin-booking-detail.view';

@Injectable()
export class AdminBookingDetail {
  constructor(private readonly prisma: PrismaService) {}

  async handle(bookingId: string): Promise<BookingDetail | null> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    const [service, location, barber, client, party, journal] = await Promise.all([
      this.service(booking.serviceId),
      this.location(booking.locationId),
      this.barber(booking.barberId),
      this.client(booking.clientId),
      this.party(booking.partyId),
      loadBookingJournal(this.prisma, booking.appointmentId ?? booking.id),
    ]);
    // prettier-ignore
    return { ...mapBookingRow(booking), service, location, barber, client, party, events: journal.events, notifications: journal.notifications };
  }

  private service(serviceId: string | null) {
    if (!serviceId) return Promise.resolve(null);
    return this.prisma.service
      .findUnique({
        where: { id: serviceId },
        select: { id: true, name: true, duration: true, category: true },
      })
      .then((row) => row ?? null);
  }

  private location(locationId: string) {
    return this.prisma.location
      .findUnique({
        where: { id: locationId },
        select: { id: true, code: true, name: true, address: true },
      })
      .then((row) => row ?? null);
  }

  private barber(barberId: string) {
    return this.prisma.user
      .findUnique({ where: { id: barberId }, select: { id: true, name: true, phone: true } })
      .then((row) => row ?? null);
  }

  // Ім'я клієнта беремо з User, а якщо воно порожнє — з картки CRM: у
  // сид-даних User.name порожній, а ім'я живе в ClientProfile.
  private client(clientId: string | null) {
    if (!clientId) return Promise.resolve(null);
    const profile = this.prisma.clientProfile.findUnique({
      where: { userId: clientId },
      select: { id: true, name: true, vipDiscountPercent: true, loyaltyVisitsCount: true },
    });
    const user = this.prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, phone: true },
    });
    return Promise.all([user, profile]).then(([owner, card]) =>
      owner
        ? {
            userId: owner.id,
            profileId: card?.id ?? null,
            name: owner.name ?? card?.name ?? null,
            phone: owner.phone,
            vipDiscountPercent: card?.vipDiscountPercent ?? null,
            loyaltyVisitsCount: card?.loyaltyVisitsCount ?? null,
          }
        : null
    );
  }

  private party(partyId: string | null) {
    if (!partyId) return Promise.resolve(null);
    return (
      this.prisma.appointmentParty
        // prettier-ignore
        .findUnique({
          where: { id: partyId },
          select: {
            id: true,
            role: true,
            mode: true,
            userId: true,
            barberId: true,
            barberIds: true,
            locationId: true,
            serviceId: true,
            agreedPrice: true,
            date: true,
            partyLegs: true,
          },
        })
        .then((row) => (row ? mapParty(row) : null))
    );
  }
}
