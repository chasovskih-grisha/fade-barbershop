// Читання грошей дня для барбера: його візити в межах київської доби та їхні
// платежі. Жодних записів — це зведення, а не друга платіжна поверхня.
import { Injectable } from '@nestjs/common';
import type { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  BarberDayMoneyPort,
  BarberDayVisit,
} from '../application/barber-day-money.use-case';

@Injectable()
export class PrismaBarberDayMoneyRepository implements BarberDayMoneyPort {
  constructor(private readonly prisma: PrismaService) {}

  async visitsFor(barberId: string, from: Date, to: Date): Promise<BarberDayVisit[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { barberId, start: { gte: from, lt: to } },
      select: { id: true, status: true, finalPrice: true, agreedPrice: true },
      orderBy: { start: 'asc' },
    });
    if (bookings.length === 0) return [];

    const payments = await this.prisma.payment.findMany({
      where: { appointmentId: { in: bookings.map((booking) => booking.id) } },
      select: { appointmentId: true, amount: true, form: true, status: true },
    });
    const byBooking = new Map<string, BarberDayVisit['payments']>();
    for (const payment of payments) {
      if (!payment.appointmentId) continue;
      const list = byBooking.get(payment.appointmentId) ?? [];
      list.push({
        amount: payment.amount,
        form: payment.form as PaymentForm,
        status: payment.status as PaymentStatus,
      });
      byBooking.set(payment.appointmentId, list);
    }

    return bookings.map((booking) => ({
      bookingId: booking.id,
      status: booking.status ?? 'booked',
      finalPrice: booking.finalPrice ?? booking.agreedPrice ?? 0,
      payments: byBooking.get(booking.id) ?? [],
    }));
  }
}
