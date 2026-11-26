/* eslint-disable max-lines, max-params -- HTTP entry points stay next to their validation; booking repo/hold status are optional read-side deps for the cabinet (split tracked in T-2500f) */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Optional,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { bearerOf } from '../identity/infrastructure/bearer-session.guard';
import { hashToken } from '../identity/domain/otp-code';
import { SESSION_COOKIE_NAME } from '../identity/infrastructure/session-cookie';
import { PrismaService } from '../shared/prisma/prisma.service';
import {
  DEPOSIT_RESUME_HEADER,
  isValidDepositResumeToken,
} from '../shared/deposit-resume-token';
import { PaymentForm } from '../billing/domain/payment-status.enum';
import { DepositHoldService } from '../scheduling/application/deposit-hold.service';
import { DepositFlow } from './application/deposit-flow.use-case';
import type { BookingPaymentPort } from './application/deposit-flow.use-case';
import { OnsitePayment } from './application/onsite-payment.use-case';
import { T094Refund } from './application/refund.use-case';
import { BOOKING_PAYMENT_REPOSITORY } from './payment.tokens';

interface OnsitePaymentBody {
  bookingId: string;
  form: PaymentForm.CASH | PaymentForm.POS;
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
    private readonly refunds: T094Refund,
    @Optional()
    @Inject(BOOKING_PAYMENT_REPOSITORY)
    private readonly bookings?: BookingPaymentPort,
    @Optional()
    @Inject(DepositHoldService)
    private readonly holds?: DepositHoldService,
    @Optional()
    private readonly prisma?: PrismaService
  ) {}

  /** GET /payment/bookings/:bookingId/deposit — чи можна ще оплатити з кабінету. */
  @Get('bookings/:bookingId/deposit')
  async depositStatus(
    @Param('bookingId') bookingId: string,
    @Req() request: Request = {} as Request
  ) {
    const booking = await this.bookings?.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    await this.assertDepositReader(request, bookingId, booking.clientId);
    const hold = await this.holds?.find(bookingId);
    const serverNow = new Date();
    const expired = !hold || hold.status !== 'active' || hold.expiresAt <= serverNow;
    if (booking.depositStatus === 'captured' || hold?.status === 'captured') {
      return { status: 'paid' as const, serverNow: serverNow.toISOString() };
    }
    if (expired) {
      return { status: 'expired' as const, serverNow: serverNow.toISOString() };
    }
    return {
      status: 'payable' as const,
      amount: hold.depositAmount,
      expiresAt: hold.expiresAt.toISOString(),
      serverNow: serverNow.toISOString(),
    };
  }

  /**
   * T-091/T-4619: депозит читає лише клієнт цього запису. Іменований запис —
   * тільки сесією свого клієнта. Підписаний resume-токен — капабіліті
   * **анонімного** запису на цей один read: він не авторизує ні барбера, ні
   * адміна і не робить booking id загальним ключем довіри.
   */
  private async assertDepositReader(
    request: Request,
    bookingId: string,
    clientId?: string | null
  ): Promise<void> {
    if (!clientId && this.hasResumeToken(request, bookingId)) return;
    if (!clientId) throw new UnauthorizedException('Deposit resume token required');
    const session = await this.activeClientSession(request);
    if (!session) throw new UnauthorizedException('Valid client session required');
    if (session.userId !== clientId)
      throw new ForbiddenException('Booking belongs to another client');
  }

  private hasResumeToken(request: Request, bookingId: string): boolean {
    const token = request.headers[DEPOSIT_RESUME_HEADER];
    return typeof token === 'string' && isValidDepositResumeToken(bookingId, token);
  }

  private async activeClientSession(request: Request): Promise<{ userId: string } | null> {
    if (!this.prisma) return null;
    const cookie = request.cookies?.[SESSION_COOKIE_NAME];
    const token = bearerOf(request) || (typeof cookie === 'string' ? cookie : '');
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { userId: true, channel: true, revokedAt: true, accessExpiresAt: true },
    });
    const accessExpired = session?.accessExpiresAt && session.accessExpiresAt <= new Date();
    if (!session || session.revokedAt || session.channel === 'admin' || accessExpired) return null;
    return { userId: session.userId };
  }

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
      refund: result.refund ?? null,
    };
  }

  /** POST /payment/onsite — mark the remaining balance paid at the shop. */
  @Post('onsite')
  @HttpCode(HttpStatus.OK)
  async payOnsite(@Body() body: OnsitePaymentBody, @Req() request: { adminUserId?: string } = {}) {
    if (body.form !== PaymentForm.CASH && body.form !== PaymentForm.POS) {
      throw new BadRequestException('form must be cash or pos');
    }
    if (!body.bookingId) throw new BadRequestException('bookingId is required');
    // Актор — лише з сесії: тіло не може назватися кимось іншим.
    const by = request.adminUserId;
    if (!by) throw new UnauthorizedException('Staff session required');
    const result = await this.onsitePayment.execute({
      bookingId: body.bookingId,
      form: body.form,
      by,
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
