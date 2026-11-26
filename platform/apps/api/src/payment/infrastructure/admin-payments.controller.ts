// T-093: admin on-site payment endpoints. Lives under /admin so the global
// AdminSessionGuard authenticates the actor; `by` is never trusted from the body.
import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentForm } from '../../billing/domain/payment-status.enum';
import { adminActor } from '../../scheduling/infrastructure/admin-actor';
import type { Request } from 'express';
import { Req } from '@nestjs/common';
import { OnsitePayment } from '../application/onsite-payment.use-case';

interface OnsiteBody {
  bookingId: string;
  form: PaymentForm.CASH | PaymentForm.POS;
}

@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly onsite: OnsitePayment) {}

  @Get('bookings/:bookingId/onsite')
  async status(@Param('bookingId') bookingId: string) {
    return this.onsite.status(bookingId);
  }

  @Post('onsite')
  async pay(@Body() body: OnsiteBody, @Req() req: Request) {
    if (body.form !== PaymentForm.CASH && body.form !== PaymentForm.POS) {
      throw new BadRequestException('form must be cash or pos');
    }
    if (!body.bookingId) throw new BadRequestException('bookingId is required');
    const result = await this.onsite.execute({
      bookingId: body.bookingId,
      form: body.form,
      by: adminActor(req).actorId,
    });
    return {
      bookingId: result.booking.id,
      outcome: result.outcome,
      paymentId: result.payment?.id ?? null,
      paidAmount: result.paidAmount,
      depositAmount: result.depositAmount,
      receipt: result.receipt ?? null,
      failureReason: result.failureReason ?? null,
      audit: result.audit,
    };
  }

  @Post('bookings/:bookingId/onsite/receipt/retry')
  async retryReceipt(@Param('bookingId') bookingId: string) {
    return this.onsite.retryReceipt(bookingId);
  }
}
