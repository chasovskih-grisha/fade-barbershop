import { PaymentCommandContext } from '../domain/ports';
import { FiscalGateway } from '../domain/fiscal.gateway.interface';
import { ReceiptIssued } from '../domain/receipt-events';

export interface IssueFiscalReceiptInput {
  paymentId: string;
  appointmentId?: string;
  orderId?: string;
  amount: number;
  type: 'prepayment' | 'sale' | 'return';
  items: Array<{ name: string; price: number; quantity: number }>;
  cashRegisterId?: string;
  traceId: string;
  customRelationId?: string;
}

export interface IssueFiscalReceiptResult {
  receiptId: string;
  fiscalCode?: string;
  status: string;
  total: number;
}

export class IssueFiscalReceiptHandler {
  constructor(private readonly ctx: PaymentCommandContext & { fiscalGateway: FiscalGateway }) {}

  async handle(input: IssueFiscalReceiptInput): Promise<IssueFiscalReceiptResult> {
    if (input.amount <= 0) {
      throw new Error('ComplimentaryVisit or zero amount: receipt not issued per PAY-003 / LYL-007');
    }

    const shift = await this.ctx.fiscalGateway.checkShiftOpen({
      cashRegisterId: input.cashRegisterId,
      traceId: input.traceId,
    });
    if (!shift.isOpen || shift.isTooLong) {
      throw new Error(`Shift check failed: isOpen=${shift.isOpen}, isTooLong=${shift.isTooLong}`);
    }

    const receipt = await this.ctx.fiscalGateway.createReceipt({
      paymentId: input.paymentId,
      ...(input.appointmentId && { appointmentId: input.appointmentId }),
      amount: input.amount,
      type: input.type,
      items: input.items,
      cashRegisterId: input.cashRegisterId,
      traceId: input.traceId,
      customRelationId: input.customRelationId,
    });

    const now = this.ctx.clock.now();
    await this.ctx.outbox.append([
      new ReceiptIssued({
        paymentId: input.paymentId,
        ...(input.appointmentId && { appointmentId: input.appointmentId }),
        ...(input.orderId && { orderId: input.orderId }),
        receiptId: receipt.receiptId,
        ...(receipt.fiscalCode && { fiscalCode: receipt.fiscalCode }),
        amount: receipt.total,
        type: input.type,
        traceId: input.traceId,
        occurredAt: now,
      }),
    ]);

    return {
      receiptId: receipt.receiptId,
      ...(receipt.fiscalCode && { fiscalCode: receipt.fiscalCode }),
      status: receipt.status,
      total: receipt.total,
    };
  }
}
