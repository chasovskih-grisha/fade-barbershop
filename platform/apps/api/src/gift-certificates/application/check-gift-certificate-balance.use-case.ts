import { GiftCertificateRepository } from './ports';

export interface CheckGiftCertificateBalanceInput {
  code: string;
  now: Date;
}

export class CheckGiftCertificateBalanceHandler {
  constructor(private readonly repo: GiftCertificateRepository) {}

  async handle(input: CheckGiftCertificateBalanceInput): Promise<{
    found: boolean;
    initialAmount?: number;
    remainingBalance?: number;
    currency?: string;
    status?: string;
    expiresAt?: Date;
    expired?: boolean;
  }> {
    const cert = await this.repo.findByCode(input.code);
    if (!cert) {
      return { found: false };
    }

    const expired = cert.isExpired(input.now);
    return {
      found: true,
      initialAmount: cert.initialAmount,
      remainingBalance: cert.remainingBalance,
      currency: cert.currency,
      status: expired && cert.status === 'active' ? 'expired' : cert.status,
      expiresAt: cert.expiresAt,
      expired,
    };
  }
}
