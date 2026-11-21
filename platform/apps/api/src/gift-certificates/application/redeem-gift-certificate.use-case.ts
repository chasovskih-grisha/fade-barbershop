import { CertificateRedeemed } from '../domain/gift-certificate.events';
import { GiftCertificateRepository, GiftCertificateOutbox } from './ports';

export interface RedeemGiftCertificateInput {
  code: string;
  amount: number;
  appointmentId?: string;
  occurredAt: Date;
}

export class RedeemGiftCertificateHandler {
  constructor(
    private readonly repo: GiftCertificateRepository,
    private readonly outbox: GiftCertificateOutbox
  ) {}

  async handle(
    input: RedeemGiftCertificateInput
  ): Promise<{ redeemedAmount: number; remainingBalance: number; status: string }> {
    const cert = await this.repo.findByCode(input.code);
    if (!cert) {
      throw new Error(`Gift certificate not found with code: ${input.code}`);
    }

    const { redeemedAmount, remainingBalance } = cert.redeem(input.amount, input.occurredAt);
    await this.repo.save(cert);

    await this.outbox.append([
      new CertificateRedeemed({
        id: cert.id,
        code: cert.code,
        redeemedAmount,
        remainingBalance,
        ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
        occurredAt: input.occurredAt,
      }),
    ]);

    return {
      redeemedAmount,
      remainingBalance,
      status: cert.status,
    };
  }
}
