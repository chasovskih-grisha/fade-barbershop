export class GiftCertificateSold {
  readonly type = 'gift-certificate.sold';
  constructor(
    public readonly payload: {
      id: string;
      code: string;
      initialAmount: number;
      currency: string;
      purchaserPhone?: string;
      recipientEmail?: string;
      expiresAt: Date;
      occurredAt: Date;
    }
  ) {}
}

export class CertificateRedeemed {
  readonly type = 'gift-certificate.redeemed';
  constructor(
    public readonly payload: {
      id: string;
      code: string;
      redeemedAmount: number;
      remainingBalance: number;
      appointmentId?: string;
      occurredAt: Date;
    }
  ) {}
}

export class GiftCertificateExpired {
  readonly type = 'gift-certificate.expired';
  constructor(
    public readonly payload: {
      id: string;
      code: string;
      remainingBalance: number;
      occurredAt: Date;
    }
  ) {}
}

export class GiftCertificateCancelled {
  readonly type = 'gift-certificate.cancelled';
  constructor(
    public readonly payload: {
      id: string;
      code: string;
      reason?: string;
      occurredAt: Date;
    }
  ) {}
}
