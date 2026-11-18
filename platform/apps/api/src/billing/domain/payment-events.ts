import { DomainEvent } from './domain-event';

export class PaymentInitiated extends DomainEvent {
  readonly type = 'billing.payment.initiated';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; providerSessionId: string; traceId: string; captureStatus?: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; providerSessionId: string; traceId: string; captureStatus?: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      amount: params.amount,
      providerSessionId: params.providerSessionId,
      traceId: params.traceId,
      ...(params.captureStatus !== undefined && { captureStatus: params.captureStatus }),
    };
  }
}

export class PaymentCaptured extends DomainEvent {
  readonly type = 'billing.payment.captured';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; receiptId: string; traceId: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; receiptId: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      amount: params.amount,
      receiptId: params.receiptId,
      traceId: params.traceId,
    };
  }
}

export class OrderPaid extends DomainEvent {
  readonly type = 'billing.order.paid';
  readonly payload: { orderId: string; paymentId: string; amount: number; receiptId: string; traceId: string };

  constructor(params: { orderId: string; paymentId: string; amount: number; receiptId: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      orderId: params.orderId,
      paymentId: params.paymentId,
      amount: params.amount,
      receiptId: params.receiptId,
      traceId: params.traceId,
    };
  }
}

export class PaymentFailed extends DomainEvent {
  readonly type = 'billing.payment.failed';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; reason: string; traceId: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; reason: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      reason: params.reason,
      traceId: params.traceId,
    };
  }
}

export class PaymentRefundedEvent extends DomainEvent {
  readonly type = 'billing.payment.refunded';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; refundId: string; traceId: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; refundId: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      amount: params.amount,
      refundId: params.refundId,
      traceId: params.traceId,
    };
  }
}

export class PaymentDisputed extends DomainEvent {
  readonly type = 'billing.payment.disputed';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; reason: string; traceId: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; amount: number; reason: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      amount: params.amount,
      reason: params.reason,
      traceId: params.traceId,
    };
  }
}

export class PaymentDisputeResolved extends DomainEvent {
  readonly type = 'billing.payment.dispute_resolved';
  readonly payload: { paymentId: string; appointmentId?: string; orderId?: string; won: boolean; traceId: string };

  constructor(params: { paymentId: string; appointmentId?: string; orderId?: string; won: boolean; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.paymentId });
    this.payload = {
      paymentId: params.paymentId,
      ...(params.appointmentId && { appointmentId: params.appointmentId }),
      ...(params.orderId && { orderId: params.orderId }),
      won: params.won,
      traceId: params.traceId,
    };
  }
}
