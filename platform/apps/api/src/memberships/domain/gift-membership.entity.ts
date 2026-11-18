export interface GiftMembershipProps {
  id: string;
  code: string;
  planId: string;
  purchaserClientId: string;
  recipientEmail?: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
  redeemedAt?: Date;
  redeemedByClientId?: string;
}

export class GiftMembership {
  private constructor(private readonly props: GiftMembershipProps) {}

  public static reconstitute(props: GiftMembershipProps): GiftMembership {
    return new GiftMembership({ ...props });
  }

  public static createNew(params: {
    id: string;
    code: string;
    planId: string;
    purchaserClientId: string;
    recipientEmail?: string;
    validityDays?: number;
    now: Date;
  }): GiftMembership {
    if (!params.code.trim()) {
      throw new Error('Gift membership code cannot be empty');
    }
    const validityDays = params.validityDays ?? 180; // 6 months default validity
    const expiresAt = new Date(params.now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    return new GiftMembership({
      id: params.id,
      code: params.code.trim().toUpperCase(),
      planId: params.planId,
      purchaserClientId: params.purchaserClientId,
      ...(params.recipientEmail ? { recipientEmail: params.recipientEmail } : {}),
      status: 'ACTIVE',
      expiresAt,
      createdAt: params.now,
    });
  }

  public redeem(clientId: string, now: Date): void {
    if (this.props.status === 'REDEEMED') {
      throw new Error('Gift membership has already been redeemed');
    }
    if (this.props.status === 'EXPIRED' || now > this.props.expiresAt) {
      this.props.status = 'EXPIRED';
      throw new Error('Gift membership has expired');
    }
    this.props.status = 'REDEEMED';
    this.props.redeemedAt = now;
    this.props.redeemedByClientId = clientId;
  }

  public get id(): string {
    return this.props.id;
  }

  public get code(): string {
    return this.props.code;
  }

  public get planId(): string {
    return this.props.planId;
  }

  public get purchaserClientId(): string {
    return this.props.purchaserClientId;
  }

  public get recipientEmail(): string | undefined {
    return this.props.recipientEmail;
  }

  public get status(): 'ACTIVE' | 'REDEEMED' | 'EXPIRED' {
    return this.props.status;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get propsData(): GiftMembershipProps {
    return { ...this.props };
  }
}
