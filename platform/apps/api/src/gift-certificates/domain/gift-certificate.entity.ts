export type GiftCertificateStatus = 'active' | 'partially_used' | 'used' | 'expired' | 'cancelled';

export interface GiftCertificateProps {
  id: string;
  code: string;
  initialAmount: number;
  remainingBalance: number;
  currency: string;
  status: GiftCertificateStatus;
  expiresAt: Date;
  purchaserPhone?: string;
  recipientEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GiftCertificate {
  private constructor(private readonly props: GiftCertificateProps) {}

  public static reconstitute(props: GiftCertificateProps): GiftCertificate {
    return new GiftCertificate({
      ...props,
    });
  }

  public static createNew(params: {
    id: string;
    code: string;
    initialAmount: number;
    currency?: string;
    validityMonths?: number;
    purchaserPhone?: string;
    recipientEmail?: string;
    now: Date;
  }): GiftCertificate {
    if (params.initialAmount <= 0) {
      throw new Error('Gift certificate initial amount must be greater than zero');
    }
    const currency = params.currency ?? 'UAH';
    const validityMonths = params.validityMonths ?? 12;
    const expiresAt = new Date(params.now.getTime());
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    return new GiftCertificate({
      id: params.id,
      code: params.code.trim().toUpperCase(),
      initialAmount: params.initialAmount,
      remainingBalance: params.initialAmount,
      currency,
      status: 'active',
      expiresAt,
      ...(params.purchaserPhone ? { purchaserPhone: params.purchaserPhone } : {}),
      ...(params.recipientEmail ? { recipientEmail: params.recipientEmail } : {}),
      createdAt: params.now,
      updatedAt: params.now,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get code(): string {
    return this.props.code;
  }

  public get initialAmount(): number {
    return this.props.initialAmount;
  }

  public get remainingBalance(): number {
    return this.props.remainingBalance;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public get status(): GiftCertificateStatus {
    return this.props.status;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get purchaserPhone(): string | undefined {
    return this.props.purchaserPhone;
  }

  public get recipientEmail(): string | undefined {
    return this.props.recipientEmail;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get propsData(): GiftCertificateProps {
    return { ...this.props };
  }

  public isExpired(now: Date): boolean {
    return now.getTime() > this.props.expiresAt.getTime();
  }

  public redeem(amount: number, now: Date): { redeemedAmount: number; remainingBalance: number } {
    if (amount <= 0) {
      throw new Error('Redemption amount must be greater than zero');
    }
    if (this.isExpired(now) || this.props.status === 'expired') {
      this.props.status = 'expired';
      this.props.updatedAt = now;
      throw new Error('Gift certificate is expired');
    }
    if (this.props.status === 'used' || this.props.status === 'cancelled') {
      throw new Error(`Cannot redeem gift certificate in status '${this.props.status}'`);
    }
    if (this.props.remainingBalance <= 0) {
      this.props.status = 'used';
      this.props.updatedAt = now;
      throw new Error('Gift certificate has zero balance');
    }

    const redeemedAmount = Math.min(amount, this.props.remainingBalance);
    this.props.remainingBalance = Number((this.props.remainingBalance - redeemedAmount).toFixed(2));
    this.props.updatedAt = now;

    if (this.props.remainingBalance === 0) {
      this.props.status = 'used';
    } else {
      this.props.status = 'partially_used';
    }

    return { redeemedAmount, remainingBalance: this.props.remainingBalance };
  }

  public expire(now: Date): void {
    if (this.props.status === 'used' || this.props.status === 'cancelled') {
      return;
    }
    this.props.status = 'expired';
    this.props.updatedAt = now;
  }

  public cancel(now: Date, _reason?: string): void {
    if (this.props.status === 'used') {
      throw new Error('Cannot cancel already fully used gift certificate');
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = now;
  }
}
