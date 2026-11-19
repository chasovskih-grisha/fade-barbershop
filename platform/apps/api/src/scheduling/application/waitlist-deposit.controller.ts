import { Controller, Post, Body, Param, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { WaitlistDepositFlow, WaitlistDepositInput, WaitlistDepositResult, PaymentProps, PaymentForm, CheckboxReceiptType } from '../../payment/application/waitlist-deposit-flow.use-case';
import { PaymentStatus as BillingPaymentStatus } from '../../billing/domain/payment-status.enum';
import { Payment } from '../../billing/domain/payment.entity';
import { UseInterceptors } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { IdempotencyGuard } from '../../shared/idempotency/idempotency.guard';
import { TracingInterceptor } from '../../shared/tracing/tracing.interceptor';
import {
  DepositSettlementService,
  type DepositSettlementResult,
} from './deposit-settlement.service';
import { DepositPolicyProvider } from '../infrastructure/deposit-policy.provider';
import type { AppointmentOutcome } from '../domain/deposit-settlement';
import type { DepositTerms } from '../domain/deposit-terms';

/** T-197: Waitlist Deposit Payment Controller
 * 
 * Endpoint: POST /scheduling/waitlist/{waitlistId}/deposit
 * Collects 30% deposit when a waitlist slot is accepted.
 * Integrates with existing payment entity and Checkbox fiscal gateway.
 * 
 * Request body:
 * {
 *   "clientId": "string",
 *   "slotId": "string", 
 *   "paymentMethod": "card|cash|pos|certificate" (optional, default CARD),
 *   "finalPrice": number (optional, calculated from slot if not provided)
 * }
 * 
 * Response: Payment status, deposit amount, receipt URL/ID, balance due status
 */
@Controller('scheduling')
@UseInterceptors(ClassSerializerInterceptor, TracingInterceptor)
export class WaitlistDepositController {
  constructor(
    private readonly depositFlow: WaitlistDepositFlow,
    private readonly settlement: DepositSettlementService
  ) {}

  /**
   * Collect 30% deposit for waitlist slot acceptance.
   * T-197: Deposit/payment functionality for waitlist bookings.
   * 
   * When a waitlist slot is accepted, the client must pay a 30% deposit
   * to secure the slot. The deposit is applied toward the final balance
   * at visit checkout.
   * 
   * Idempotent: duplicate requests with same traceId are ignored.
   */
  @Post('waitlist/:waitlistId/deposit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  async collectWaitlistDeposit(
    @Param('waitlistId') waitlistId: string,
    @Body() body: {
      clientId: string;
      slotId: string;
      paymentMethod?: PaymentForm;
      finalPrice: number;
    },
    @Query('traceId') traceId?: string,
  ): Promise<{
    paymentId: string;
    status: BillingPaymentStatus;
    depositAmount: number;
    finalPrice: number;
    requiresBalance: boolean;
    receiptId?: string;
    traceId: string;
  }> {
    const input: WaitlistDepositInput = {
      waitlistId,
      clientId: body.clientId,
      slotId: body.slotId,
      finalPrice: body.finalPrice,
      occurredAt: new Date(),
    };

    const result = await this.depositFlow.execute(input);

    const response: {
      paymentId: string;
      status: BillingPaymentStatus;
      depositAmount: number;
      finalPrice: number;
      requiresBalance: boolean;
      receiptId?: string;
      traceId: string;
    } = {
      paymentId: result.payment.id,
      status: result.payment.status,
      depositAmount: result.depositAmount,
      finalPrice: body.finalPrice,
      requiresBalance: result.requiresBalance,
      traceId: result.payment.traceId,
    };
    const receiptId = result.depositReceipt?.check_id;
    if (receiptId) response.receiptId = receiptId;
    return response;
  }

  /**
   * Check deposit status for a waitlist entry.
   * GET /scheduling/waitlist/{waitlistId}/deposit/status
   */
  @Get('waitlist/:waitlistId/deposit/status')
  @HttpCode(HttpStatus.OK)
  async getWaitlistDepositStatus(
    @Param('waitlistId') waitlistId: string,
  ): Promise<{
    paymentId: string;
    status: BillingPaymentStatus;
    depositAmount: number;
    finalPrice: number;
    receiptId?: string;
    updatedAt: Date;
  }> {
    const payment = await this.depositFlow.findPaymentByWaitlistId(waitlistId);

    if (!payment) {
      return {
        paymentId: '',
        status: BillingPaymentStatus.AWAITING_DEPOSIT,
        depositAmount: 0,
        finalPrice: 0,
        updatedAt: new Date(),
      };
    }

    const response: {
      paymentId: string;
      status: BillingPaymentStatus;
      depositAmount: number;
      finalPrice: number;
      receiptId?: string;
      updatedAt: Date;
    } = {
      paymentId: payment.id,
      status: payment.status,
      depositAmount: payment.amount,
      finalPrice: payment.amount,
      updatedAt: payment.updatedAt,
    };
    if (payment.receiptId) response.receiptId = payment.receiptId;
    return response;
  }

  /**
   * Розрахунок депозита при завершенні візиту (T-160): no-show і пізнє
   * скасування лишають депозит у салоні, своєчасне — повертають, візит —
   * зараховує його в рахунок. Суму беремо з платежу, а не з запиту.
   */
  @Post('waitlist/:waitlistId/deposit/settle')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  async settleWaitlistDeposit(
    @Param('waitlistId') waitlistId: string,
    @Body() body: {
      outcome: AppointmentOutcome;
      appointmentStart: string;
      occurredAt?: string;
    },
  ): Promise<{
    paymentId: string;
    status: BillingPaymentStatus;
    action: string;
    reason: string;
    refundAmount: number;
    retainedAmount: number;
    refunded: boolean;
    refundReceiptId?: string;
  }> {
    const payment = await this.depositFlow.findPaymentByWaitlistId(waitlistId);
    if (!payment) {
      throw new Error(`No deposit for waitlist entry ${waitlistId}`);
    }

    const policy = await DepositPolicyProvider.get();
    const terms: DepositTerms = {
      amount: payment.amount,
      percent: policy.percent,
      rounding: policy.rounding,
      cancellationWindowHours: policy.cancellationWindowHours,
    };

    const result: DepositSettlementResult = await this.settlement.settle({
      paymentId: payment.id,
      terms,
      outcome: body.outcome,
      appointmentStart: new Date(body.appointmentStart),
      ...(body.occurredAt ? { occurredAt: new Date(body.occurredAt) } : {}),
    });

    const response: {
      paymentId: string;
      status: BillingPaymentStatus;
      action: string;
      reason: string;
      refundAmount: number;
      retainedAmount: number;
      refunded: boolean;
      refundReceiptId?: string;
    } = {
      paymentId: result.payment.id,
      status: result.payment.status,
      action: result.action,
      reason: result.reason,
      refundAmount: result.refundAmount,
      retainedAmount: result.retainedAmount,
      refunded: result.refunded,
    };
    if (result.refundReceiptId) response.refundReceiptId = result.refundReceiptId;
    return response;
  }

  /**
   * Get payment receipt for a waitlist deposit.
   * GET /scheduling/waitlist/{waitlistId}/deposit/receipt
   */
  @Get('waitlist/:waitlistId/deposit/receipt')
  @HttpCode(HttpStatus.OK)
  async getWaitlistDepositReceipt(
    @Param('waitlistId') waitlistId: string,
  ): Promise<{
    checkId: string;
    type: CheckboxReceiptType;
    amount: number;
    status: 'pending' | 'signed' | 'failed';
    createdAt: Date;
    signedAt?: Date;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const payment = await this.depositFlow.findPaymentByWaitlistId(waitlistId);

    if (!payment || !payment.receiptId) {
      return {
        checkId: '',
        type: CheckboxReceiptType.Deposit,
        amount: 0,
        status: 'pending',
        createdAt: new Date(),
      };
    }

    const receipt = await this.depositFlow.issueDepositReceipt(
      waitlistId,
      payment.amount,
      payment.receiptId
    );

    if (!receipt) {
      return {
        checkId: '',
        type: CheckboxReceiptType.Deposit,
        amount: payment.amount,
        status: 'pending',
        createdAt: new Date(),
      };
    }

    const result = {
      checkId: receipt.check_id,
      type: receipt.type,
      amount: receipt.amount,
      status: receipt.status,
      createdAt: receipt.created_at,
    } as {
      checkId: string;
      type: CheckboxReceiptType;
      amount: number;
      status: 'pending' | 'signed' | 'failed';
      createdAt: Date;
      signedAt?: Date;
      errorCode?: string;
      errorMessage?: string;
    };
    if (receipt.signed_at) result.signedAt = receipt.signed_at;
    if (receipt.error_code) result.errorCode = receipt.error_code;
    if (receipt.error_message) result.errorMessage = receipt.error_message;
    return result;
  }
}