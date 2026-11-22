/* eslint-disable max-lines -- HTTP entry points stay next to their validation (104 vs 100); split tracked in T-2500f */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { PaymentForm } from '../billing/domain/payment-status.enum';
import { DepositFlow } from './application/deposit-flow.use-case';
import { OnsitePayment } from './application/onsite-payment.use-case';
import { T094Refund } from './application/refund.use-case';

interface OnsitePaymentBody {
  bookingId: string;
  form: PaymentForm.CASH | PaymentForm.POS;
  by: string;
}

interface RefundBody {
  bookingId: string;
  amount?: number;
  reasonCode?: string;
  refundId?: string;
}

/** HTTP entry points for the payment module (T-091, T-093, T-094). */
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly depositFlow: DepositFlow,
    private readonly onsitePayment: OnsitePayment,
    private readonly refunds: T094Refund
  ) {}

  /** POST /payment/bookings/:bookingId/deposit — collect the booking deposit. */
  @Post('bookings/:bookingId/deposit')
  @HttpCode(HttpStatus.OK)
  async collectDeposit(@Param('bookingId') bookingId: string) {
    const result = await this.depositFlow.execute(bookingId);
    return {
      bookingId: result.booking.id,
      outcome: result.outcome,
      paymentId: result.payment?.id ?? null,
      depositAmount: result.depositAmount,
      requiresBalance: result.requiresBalance,
      receiptId: result.receipt?.check_id ?? null,
      failureReason: result.failureReason ?? null,
    };
  }

  /** POST /payment/onsite — mark the remaining balance paid at the shop. */
  @Post('onsite')
  @HttpCode(HttpStatus.OK)
  async payOnsite(@Body() body: OnsitePaymentBody) {
    if (body.form !== PaymentForm.CASH && body.form !== PaymentForm.POS) {
      throw new BadRequestException('form must be cash or pos');
    }
    if (!body.bookingId || !body.by?.trim()) {
      throw new BadRequestException('bookingId and by are required');
    }
    const result = await this.onsitePayment.execute({
      bookingId: body.bookingId,
      form: body.form,
      by: body.by,
    });
    return {
      bookingId: result.booking.id,
      outcome: result.outcome,
      paymentId: result.payment?.id ?? null,
      paidAmount: result.paidAmount,
      depositAmount: result.depositAmount,
      receiptId: result.receipt?.check_id ?? null,
      failureReason: result.failureReason ?? null,
      audit: result.audit,
    };
  }

  /** POST /payment/refunds — initiate or replay an idempotent refund. */
  @Post('refunds')
  @HttpCode(HttpStatus.OK)
  async initiateRefund(@Body() body: RefundBody) {
    if (!body.bookingId) throw new BadRequestException('bookingId is required');
    if (body.amount !== undefined) {
      if (!Number.isInteger(body.amount) || body.amount <= 0) {
        throw new BadRequestException('amount must be a positive integer');
      }
    }
    if (body.refundId !== undefined && !body.refundId.trim()) {
      throw new BadRequestException('refundId must not be empty');
    }
    const result = await this.refunds.initiateRefund(
      body.bookingId,
      body.amount,
      body.reasonCode,
      body.refundId
    );
    return { refund: result.refund, isDuplicate: result.isDuplicate };
  }

  /** POST /payment/refunds/:refundId/retry — retry a failed refund. */
  @Post('refunds/:refundId/retry')
  @HttpCode(HttpStatus.OK)
  async retryRefund(@Param('refundId') refundId: string) {
    return { refund: await this.refunds.retryRefund(refundId) };
  }

  /** GET /payment/refunds/:refundId — refund state for admin/cabinet. */
  @Get('refunds/:refundId')
  async refundStatus(@Param('refundId') refundId: string) {
    const refund = await this.refunds.refundStatus(refundId);
    if (!refund) throw new NotFoundException(`Refund ${refundId} not found`);
    return { refund };
  }
}
