import { GiftCertificate } from '../domain/gift-certificate.entity';
import { GiftCertificateSold } from '../domain/gift-certificate.events';
import { GiftCertificateRepository, CertificateCodeGenerator, GiftCertificateOutbox } from './ports';

export interface CreateGiftCertificateInput {
  id: string;
  initialAmount: number;
  currency?: string;
  validityMonths?: number;
  purchaserPhone?: string;
  recipientEmail?: string;
  occurredAt: Date;
}

export class CreateGiftCertificateHandler {
  constructor(
    private readonly repo: GiftCertificateRepository,
    private readonly codeGen: CertificateCodeGenerator,
    private readonly outbox: GiftCertificateOutbox
  ) {}

  async handle(input: CreateGiftCertificateInput): Promise<{ id: string; code: string; initialAmount: number; expiresAt: Date }> {
    const code = this.codeGen.generateCode();
    const cert = GiftCertificate.createNew({
      id: input.id,
      code,
      initialAmount: input.initialAmount,
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.validityMonths !== undefined ? { validityMonths: input.validityMonths } : {}),
      ...(input.purchaserPhone ? { purchaserPhone: input.purchaserPhone } : {}),
      ...(input.recipientEmail ? { recipientEmail: input.recipientEmail } : {}),
      now: input.occurredAt,
    });

    await this.repo.save(cert);
    await this.outbox.append([
      new GiftCertificateSold({
        id: cert.id,
        code: cert.code,
        initialAmount: cert.initialAmount,
        currency: cert.currency,
        ...(cert.purchaserPhone ? { purchaserPhone: cert.purchaserPhone } : {}),
        ...(cert.recipientEmail ? { recipientEmail: cert.recipientEmail } : {}),
        expiresAt: cert.expiresAt,
        occurredAt: input.occurredAt,
      }),
    ]);

    return {
      id: cert.id,
      code: cert.code,
      initialAmount: cert.initialAmount,
      expiresAt: cert.expiresAt,
    };
  }
}
