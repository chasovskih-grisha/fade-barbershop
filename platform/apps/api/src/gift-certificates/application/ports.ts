import { GiftCertificate } from '../domain/gift-certificate.entity';

export interface GiftCertificateRepository {
  findByCode(code: string): Promise<GiftCertificate | null>;
  findById(id: string): Promise<GiftCertificate | null>;
  save(cert: GiftCertificate): Promise<void>;
}

export interface CertificateCodeGenerator {
  generateCode(): string;
}

export interface GiftCertificateOutbox {
  append(events: Array<{ type: string; payload: Record<string, unknown> }>): Promise<void>;
}
