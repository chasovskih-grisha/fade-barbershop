import { PaymentCommandContext } from '../domain/ports';
import { AcquiringGateway, InvoiceDetails } from '../domain/acquiring.gateway.interface';

export interface RetrieveInvoiceInput {
  paymentId: string;
  traceId: string;
}

export interface RetrieveInvoiceResult {
  paymentId: string;
  invoice: InvoiceDetails;
  status: string;
  traceId: string;
}

export class RetrieveInvoiceHandler {
  constructor(private readonly ctx: PaymentCommandContext & { acquiringGateway: AcquiringGateway }) {}

  async handle(input: RetrieveInvoiceInput): Promise<RetrieveInvoiceResult> {
    const payment = await this.ctx.payments.findById(input.paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${input.paymentId} not found`);
    }

    const verification = await this.ctx.acquiringGateway.verifyPaymentStatus({
      paymentId: payment.id,
      providerSessionId: payment.id,
      traceId: input.traceId,
    });

    const invoice: InvoiceDetails = verification.invoice || {
      invoiceId: `inv_${payment.id}_fallback`,
      taxRate: 0.20,
      taxAmount: Math.round(payment.amount * 0.20 * 100) / 100,
      subtotal: Math.round(payment.amount * 0.80 * 100) / 100,
      total: payment.amount,
      issuedAt: this.ctx.clock.now(),
    };

    return {
      paymentId: payment.id,
      invoice,
      status: payment.status,
      traceId: input.traceId,
    };
  }
}
