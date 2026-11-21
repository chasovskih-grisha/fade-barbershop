import { DomainEvent } from './domain-event';

export class ReceiptIssued extends DomainEvent {
  readonly type = 'billing.receipt.issued';
  readonly payload: {
    paymentId: string;
    appointmentId?: string;
    orderId?: string;
    receiptId: string;
    fiscalCode?: string;
    amount: number;
    type: string;
    traceId: string;
  };

  constructor(params: {
    paymentId: string;
    appointmentId?: string;
    orderId?: string;
    receiptId: string;
    fiscalCode?: string;
    amount: number;
    type: string;
    traceId: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      receiptId: params.receiptId,
      ...(params.fiscalCode && { fiscalCode: params.fiscalCode }),
      amount: params.amount,
      type: params.type,
      traceId: params.traceId,
    };
  }
}
