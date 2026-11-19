import { PaymentStatus, PaymentForm } from './payment-status.enum';

export interface PaymentProps {
  id: string;
  appointmentId?: string;
  orderId?: string;
  clientId: string;
  amount: number;
  form: PaymentForm;
  status: PaymentStatus;
  traceId: string;
  receiptId?: string;
  refundReason?: string;
  refundedAmount?: number;
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private props: PaymentProps;

  constructor(props: PaymentProps) {
    if (props.amount < 0) {
      throw new Error('Payment amount cannot be negative');
    }
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }

  get appointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get form(): PaymentForm {
    return this.props.form;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get traceId(): string {
    return this.props.traceId;
  }

  get receiptId(): string | undefined {
    return this.props.receiptId;
  }

  get refundReason(): string | undefined {
    return this.props.refundReason;
  }

  get refundedAmount(): number {
    return this.props.refundedAmount ?? 0;
  }

  get retryCount(): number {
    return this.props.retryCount ?? 0;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public markDepositPaid(receiptId: string): void {
    if (this.props.status !== PaymentStatus.AWAITING_DEPOSIT) {
      throw new Error(`Cannot mark deposit paid from status ${this.props.status}`);
    }
    this.props.status = PaymentStatus.DEPOSIT_PAID;
    this.props.receiptId = receiptId;
    this.props.updatedAt = new Date();
  }

  public markAwaitingBalance(): void {
    if (this.props.status !== PaymentStatus.DEPOSIT_PAID) {
      throw new Error(`Cannot transition to awaiting balance from status ${this.props.status}`);
    }
    this.props.status = PaymentStatus.AWAITING_BALANCE;
    this.props.updatedAt = new Date();
  }

  public markPaid(receiptId: string): void {
    if (this.props.status !== PaymentStatus.AWAITING_BALANCE && this.props.status !== PaymentStatus.DEPOSIT_PAID && this.props.status !== PaymentStatus.AWAITING_DEPOSIT) {
      throw new Error(`Cannot mark paid from status ${this.props.status}`);
    }
    this.props.status = PaymentStatus.PAID;
    this.props.receiptId = receiptId;
    this.props.updatedAt = new Date();
  }

  public initiateRefund(reason: string, refundAmount?: number): void {
    if (this.props.status !== PaymentStatus.PAID && this.props.status !== PaymentStatus.DEPOSIT_PAID && this.props.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new Error(`Cannot refund payment in status ${this.props.status}`);
    }
    const targetAmount = refundAmount ?? (this.amount - this.refundedAmount);
    if (targetAmount <= 0 || (this.refundedAmount + targetAmount) > this.amount) {
      throw new Error(`Invalid refund amount ${targetAmount}. Total refunded cannot exceed payment amount ${this.amount}`);
    }
    this.props.status = PaymentStatus.REFUNDING;
    this.props.refundReason = reason;
    this.props.updatedAt = new Date();
  }

  public completeRefund(receiptId: string, refundedAmount?: number): void {
    if (this.props.status !== PaymentStatus.REFUNDING) {
      throw new Error(`Cannot complete refund when status is ${this.props.status}`);
    }
    const addedRefund = refundedAmount ?? (this.amount - this.refundedAmount);
    const newTotalRefunded = this.refundedAmount + addedRefund;
    
    this.props.refundedAmount = newTotalRefunded;
    this.props.receiptId = receiptId;
    this.props.status = newTotalRefunded >= this.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    this.props.updatedAt = new Date();
  }

  public failRefund(_reason: string): void {
    if (this.props.status !== PaymentStatus.REFUNDING) {
      throw new Error(`Cannot fail refund when status is ${this.props.status}`);
    }
    const currentRetries = this.props.retryCount ?? 0;
    this.props.retryCount = currentRetries + 1;
    this.props.status = PaymentStatus.REFUND_FAILED;
    this.props.updatedAt = new Date();
  }

  public retryRefund(): void {
    if (this.props.status !== PaymentStatus.REFUND_FAILED) {
      throw new Error(`Can only retry refund from refund_failed status`);
    }
    if (this.retryCount >= 2) {
      throw new Error(`Maximum refund retry attempts (2) reached`);
    }
    this.props.status = PaymentStatus.REFUNDING;
    this.props.updatedAt = new Date();
  }

  public markDisputed(reason: string): void {
    if (this.props.status !== PaymentStatus.PAID && this.props.status !== PaymentStatus.DEPOSIT_PAID) {
      throw new Error(`Cannot dispute payment in status ${this.props.status}`);
    }
    this.props.status = PaymentStatus.DISPUTED;
    this.props.refundReason = reason;
    this.props.updatedAt = new Date();
  }

  public resolveDispute(won: boolean): void {
    if (this.props.status !== PaymentStatus.DISPUTED) {
      throw new Error(`Cannot resolve dispute when payment is not in disputed status`);
    }
    this.props.status = won ? PaymentStatus.PAID : PaymentStatus.REFUNDED;
    this.props.updatedAt = new Date();
  }

  public toJSON(): PaymentProps {
    return { ...this.props };
  }
}
