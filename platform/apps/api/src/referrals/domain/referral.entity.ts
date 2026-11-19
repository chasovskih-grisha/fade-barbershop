export type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REVOKED';

export interface ReferralCodeProps {
  clientId: string;
  code: string;
  createdAt: Date;
}

export interface ReferralProps {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  status: ReferralStatus;
  qualifiedAt?: Date | null;
  rewardIssuedAt?: Date | null;
  createdAt: Date;
}

export class ReferralCode {
  constructor(private readonly props: ReferralCodeProps) {}

  get clientId(): string {
    return this.props.clientId;
  }
  get code(): string {
    return this.props.code;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(clientId: string, code?: string): ReferralCode {
    const generatedCode = code || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return new ReferralCode({
      clientId,
      code: generatedCode,
      createdAt: new Date(),
    });
  }
}

export class Referral {
  constructor(private props: ReferralProps) {}

  get id(): string {
    return this.props.id;
  }
  get referrerId(): string {
    return this.props.referrerId;
  }
  get referredId(): string {
    return this.props.referredId;
  }
  get code(): string {
    return this.props.code;
  }
  get status(): ReferralStatus {
    return this.props.status;
  }
  get qualifiedAt(): Date | null {
    return this.props.qualifiedAt ?? null;
  }
  get rewardIssuedAt(): Date | null {
    return this.props.rewardIssuedAt ?? null;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  qualify(): void {
    if (this.props.status !== 'PENDING') {
      throw new Error(`Cannot qualify referral in status ${this.props.status}`);
    }
    this.props.status = 'QUALIFIED';
    this.props.qualifiedAt = new Date();
  }

  reward(): void {
    if (this.props.status !== 'QUALIFIED') {
      throw new Error(`Cannot reward referral in status ${this.props.status}`);
    }
    this.props.status = 'REWARDED';
    this.props.rewardIssuedAt = new Date();
  }

  revoke(_reason?: string): void {
    if (this.props.status === 'REWARDED') {
      // Allow revocation if needed for fraud/no-shows
    }
    this.props.status = 'REVOKED';
  }

  /** Відновлення зі сховища (або фікстура з явними датами) без побічних ефектів. */
  static reconstitute(props: ReferralProps): Referral {
    return new Referral({ ...props });
  }

  static create(referrerId: string, referredId: string, code: string): Referral {
    if (referrerId === referredId) {
      throw new Error('Self-referral is not allowed');
    }
    return new Referral({
      id: `ref_${Math.random().toString(36).substring(2, 10)}`,
      referrerId,
      referredId,
      code,
      status: 'PENDING',
      createdAt: new Date(),
    });
  }
}
