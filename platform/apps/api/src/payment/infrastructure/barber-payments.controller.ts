/* eslint-disable max-lines, max-params -- одна барберська платіжна поверхня: позначка решти, статус і зведення дня; рознесення сховало б спільну перевірку сесії */
// T-093: barbers mark the remainder on their own walk-in visits. The client/mobile
// session identifies the barber; the body never supplies the actor.
//
// Межа поверхні — лише позначка: сума до сплати і форма. Депозит, фінальна
// ціна, статус чека, «Повторити чек» і refunds живуть в адмінській картці
// (`admin-payments.controller.ts`), щоб тут не виросла третя платіжна
// поверхня.
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Booking } from '../../scheduling/domain/booking';
import type { Request } from 'express';
import { PaymentForm } from '../../billing/domain/payment-status.enum';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import type { BookingPaymentPort } from '../application/deposit-flow.use-case';
import { OnsitePayment } from '../application/onsite-payment.use-case';
import { BarberDayMoney } from '../application/barber-day-money.use-case';
import { BOOKING_PAYMENT_REPOSITORY } from '../payment.tokens';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface OnsiteBody {
  bookingId: string;
  form: PaymentForm.CASH | PaymentForm.POS;
}

/**
 * PAY-ONS-01 / WALK-BAR-03: барбер позначає решту лише на **своєму**
 * завершеному walk-in; решту онлайн-візиту позначає адміністратор. Це та сама
 * умова, що у веб-кнопці (`apps/web/src/app/barber/page.tsx`), тому сервер не
 * може відмовити в тому, що UI показав, і навпаки.
 */
function assertBarberMayMark(booking: Booking): void {
  if (booking.source !== 'walk_in') {
    throw new ForbiddenException('Barbers may only mark payment on walk-in visits');
  }
  if (booking.status !== 'completed') {
    throw new ConflictException(
      'Walk-in payment can be marked only after the service is completed'
    );
  }
}

@Controller('barber/payments')
@UseGuards(ClientSessionGuard)
export class BarberPaymentsController {
  constructor(
    private readonly onsite: OnsitePayment,
    @Inject(BOOKING_PAYMENT_REPOSITORY)
    private readonly bookings: BookingPaymentPort,
    private readonly prisma: PrismaService,
    private readonly dayMoney: BarberDayMoney
  ) {}

  /**
   * T-4404: скільки барбер узяв за добу (готівка/термінал/картка) і скільки
   * лишилось винним. Лише його власні візити; дата — київська доба.
   */
  @Get('day-summary')
  async daySummary(@Query('date') date: string | undefined, @Req() req: Request) {
    const barberId = await this.assertBarber(req);
    const day = date ?? new Date().toISOString().slice(0, 10);
    const summary = await this.dayMoney.execute(barberId, day);
    if (!summary) throw new BadRequestException('date must be YYYY-MM-DD');
    return summary;
  }

  @Get('bookings/:bookingId/onsite')
  async status(@Param('bookingId') bookingId: string, @Req() req: Request) {
    await this.assertOwnBooking(req, bookingId);
    const { amountDue, paymentStatus } = await this.onsite.status(bookingId);
    return { bookingId, amountDue, paymentStatus };
  }

  @Post('onsite')
  async pay(@Body() body: OnsiteBody, @Req() req: Request) {
    if (body.form !== PaymentForm.CASH && body.form !== PaymentForm.POS) {
      throw new BadRequestException('form must be cash or pos');
    }
    if (!body.bookingId) throw new BadRequestException('bookingId is required');
    const booking = await this.assertOwnBooking(req, body.bookingId);
    assertBarberMayMark(booking);
    const result = await this.onsite.execute({
      bookingId: body.bookingId,
      form: body.form,
      by: booking.barberId,
    });
    return {
      bookingId: result.booking.id,
      outcome: result.outcome,
      paidAmount: result.paidAmount,
      failureReason: result.failureReason ?? null,
    };
  }

  /** Сесія мусить бути активним барбером; повертає його id. */
  private async assertBarber(req: Request): Promise<string> {
    const session = clientSessionOf(req);
    if (!session) throw new UnauthorizedException('Client session required');
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || user.role !== 'barber' || !user.active) {
      throw new ForbiddenException('Barber access required');
    }
    return user.id;
  }

  private async assertOwnBooking(req: Request, bookingId: string): Promise<Booking> {
    const barberId = await this.assertBarber(req);
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.barberId !== barberId) {
      throw new ForbiddenException('Booking belongs to another barber');
    }
    return booking;
  }
}
