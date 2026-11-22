/* eslint-disable max-params -- Checkbox receipt signature is fixed by the existing DepositReceiptGateway port (4 args). */
import { Injectable } from '@nestjs/common';
import { StripeAcquiringGateway } from '../../billing/infrastructure/stripe-acquiring.gateway';
import type { DepositCaptureGateway, DepositReceiptGateway } from '../application/deposit-flow.use-case';
import type { ExpenditureReceiptGateway } from '../application/refund.use-case';
import {
  CheckboxFiscalGateway,
  type CheckboxReceipt,
  type CheckboxReceiptType,
} from '../application/checkbox-fiscal-gateway';

/** Acquiring adapter: creates the capture session for a deposit/on-site payment. */
@Injectable()
export class StripePaymentCaptureGateway implements DepositCaptureGateway {
  constructor(private readonly acquiring: StripeAcquiringGateway) {}

  async capture(paymentId: string, amount: number): Promise<boolean> {
    const session = await this.acquiring.createPaymentSession({
      paymentId,
      amount,
      currency: 'UAH',
      traceId: `capture_${paymentId}`,
      successUrl: '',
      cancelUrl: '',
      automaticCapture: true,
    });
    return Boolean(session.providerSessionId);
  }
}

/** Fiscal receipt adapter for deposit and remainder/full-payment receipts. */
@Injectable()
export class CheckboxPaymentReceiptGateway implements DepositReceiptGateway {
  constructor(private readonly checkbox: CheckboxFiscalGateway) {}

  issueReceipt(
    bookingId: string,
    amount: number,
    type: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt> {
    return this.checkbox.issueReceipt(bookingId, amount, type, checkId);
  }
}

/**
 * Expenditure receipt adapter. The Checkbox refund endpoint is not wired yet,
 * so the adapter records a deterministic audit receipt; failures from the
 * provider are modelled by returning `status: 'failed'`.
 */
@Injectable()
export class InProcessExpenditureReceiptGateway implements ExpenditureReceiptGateway {
  async issueRefundReceipt(input: {
    refundId: string;
    bookingId: string;
    amount: number;
    relatedReceiptId?: string;
  }): Promise<{ receiptId: string; status: 'done' | 'failed'; error?: string }> {
    if (!input.refundId.trim()) {
      return { receiptId: '', status: 'failed', error: 'refund_id_required' };
    }
    return { receiptId: `refund_${input.refundId}`, status: 'done' };
  }
}
