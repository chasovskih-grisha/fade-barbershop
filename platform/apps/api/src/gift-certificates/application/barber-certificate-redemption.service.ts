/* eslint-disable max-lines, max-params -- cohesive module (205 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
/**
 * T-4456: погашення сертифіката з барберського додатка.
 *
 * Правила — у domain/certificate-redemption.ts. Тут порти (сховище
 * сертифікатів, outbox, журнал погашень, годинник) і послідовність:
 * ідемпотентність за ключем → перевірка балансу/терміну → списання →
 * подія `gift-certificate.redeemed` → запис у журнал із чеком.
 *
 * Сховище in-memory: у `prisma/schema.prisma` ще немає таблиць сертифікатів
 * і погашень — порти готові до Prisma-адаптера.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CertificateRedeemed } from '../domain/gift-certificate.events';
import {
  CertificateRedemptionConflictError,
  CertificateRedemptionError,
  assertRedeemable,
  assertRedemptionActor,
  certificateRedemptionKey,
  normalizeCertificateCode,
  planCertificateRedemption,
  type CertificateRedemptionRecord,
  type CertificateReceipt,
} from '../domain/certificate-redemption';
import type { GiftCertificateOutbox, GiftCertificateRepository } from './ports';
import { GiftCertificate } from '../domain/gift-certificate.entity';

export const CERTIFICATE_REDEMPTION_LEDGER = 'CERTIFICATE_REDEMPTION_LEDGER';
export const CERTIFICATE_REDEMPTION_CLOCK = 'CERTIFICATE_REDEMPTION_CLOCK';

export interface CertificateRedemptionClock {
  now(): Date;
}

export interface CertificateRedemptionLedger {
  findByKey(key: string): Promise<CertificateRedemptionRecord | null>;
  append(record: CertificateRedemptionRecord): Promise<void>;
  list(filter?: { certificateId?: string; code?: string }): Promise<CertificateRedemptionRecord[]>;
}

export class InMemoryCertificateRedemptionLedger implements CertificateRedemptionLedger {
  private readonly byKey = new Map<string, CertificateRedemptionRecord>();

  async findByKey(key: string): Promise<CertificateRedemptionRecord | null> {
    return this.byKey.get(key) ?? null;
  }

  async append(record: CertificateRedemptionRecord): Promise<void> {
    this.byKey.set(certificateRedemptionKey(record.certificateCode, record.idempotencyKey), record);
  }

  async list(filter: { certificateId?: string; code?: string } = {}) {
    const code = filter.code ? normalizeCertificateCode(filter.code) : undefined;
    return [...this.byKey.values()]
      .filter((record) => !filter.certificateId || record.certificateId === filter.certificateId)
      .filter((record) => !code || normalizeCertificateCode(record.certificateCode) === code)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }
}

export class InMemoryGiftCertificateRepository implements GiftCertificateRepository {
  private readonly certificates = new Map<string, GiftCertificate>();

  async findByCode(code: string): Promise<GiftCertificate | null> {
    const normalized = normalizeCertificateCode(code);
    for (const certificate of this.certificates.values()) {
      if (normalizeCertificateCode(certificate.code) === normalized) return certificate;
    }
    return null;
  }

  async findById(id: string): Promise<GiftCertificate | null> {
    return this.certificates.get(id) ?? null;
  }

  async save(cert: GiftCertificate): Promise<void> {
    this.certificates.set(cert.id, cert);
  }
}

export interface RedemptionView {
  certificateCode: string;
  certificateId: string;
  coveredAmount: number;
  remainingBalance: number;
  status: string;
  dueAmount: number;
  receipt: CertificateReceipt;
  replayed: boolean;
  at: Date;
}

export interface CertificateBalanceView {
  found: boolean;
  code: string;
  initialAmount?: number;
  remainingBalance?: number;
  currency?: string;
  status?: string;
  expiresAt?: Date;
  expired?: boolean;
  redeemable?: boolean;
}

@Injectable()
export class BarberCertificateRedemptionService {
  constructor(
    @Inject('GIFT_CERTIFICATE_REPOSITORY')
    private readonly repository: GiftCertificateRepository,
    @Inject('GIFT_CERTIFICATE_OUTBOX')
    private readonly outbox: GiftCertificateOutbox,
    @Inject(CERTIFICATE_REDEMPTION_LEDGER)
    private readonly ledger: CertificateRedemptionLedger,
    @Inject(CERTIFICATE_REDEMPTION_CLOCK)
    private readonly clock: CertificateRedemptionClock
  ) {}

  /**
   * Погашення. Той самий `idempotencyKey` для того самого коду повертає
   * збережений результат без нового списання (захист від подвійного скану).
   */
  async redeem(input: {
    actorId: string;
    actorRole: string;
    code: string;
    amount: number;
    appointmentTotal: number;
    appointmentId?: string;
    idempotencyKey: string;
    at?: Date;
  }): Promise<RedemptionView> {
    assertRedemptionActor(input.actorRole);

    const actorId = input.actorId.trim();
    if (!actorId) throw new CertificateRedemptionError('Barber id is required');

    const code = normalizeCertificateCode(input.code);
    if (!code) throw new CertificateRedemptionError('Certificate code is required');

    const idempotencyKey = input.idempotencyKey.trim();
    if (!idempotencyKey) {
      throw new CertificateRedemptionError('Idempotency key is required for a scan');
    }

    const key = certificateRedemptionKey(code, idempotencyKey);
    const existing = await this.ledger.findByKey(key);
    if (existing) {
      return {
        certificateCode: existing.certificateCode,
        certificateId: existing.certificateId,
        coveredAmount: existing.coveredAmount,
        remainingBalance: existing.remainingBalance,
        status: existing.status,
        dueAmount: existing.dueAmount,
        receipt: existing.receipt,
        replayed: true,
        at: existing.at,
      };
    }

    const certificate = await this.repository.findByCode(code);
    if (!certificate) {
      throw new CertificateRedemptionError(`Gift certificate not found: ${code}`);
    }

    const at = input.at ?? this.clock.now();
    const plan = planCertificateRedemption({
      certificate,
      now: at,
      amount: input.amount,
      appointmentTotal: input.appointmentTotal,
      appointmentId: input.appointmentId ?? null,
    });

    const { redeemedAmount, remainingBalance } = certificate.redeem(plan.coveredAmount, at);
    await this.repository.save(certificate);

    await this.outbox.append([
      new CertificateRedeemed({
        id: certificate.id,
        code: certificate.code,
        redeemedAmount,
        remainingBalance,
        ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
        occurredAt: at,
      }),
    ]);

    const record: CertificateRedemptionRecord = {
      certificateId: certificate.id,
      certificateCode: certificate.code,
      coveredAmount: redeemedAmount,
      remainingBalance,
      status: certificate.status,
      appointmentTotal: plan.receipt.appointmentTotal,
      dueAmount: plan.dueAmount,
      appointmentId: plan.receipt.appointmentId,
      idempotencyKey,
      by: actorId,
      at,
      receipt: plan.receipt,
      source: 'gift_certificate',
    };
    await this.ledger.append(record);

    return {
      certificateCode: record.certificateCode,
      certificateId: record.certificateId,
      coveredAmount: record.coveredAmount,
      remainingBalance,
      status: record.status,
      dueAmount: plan.dueAmount,
      receipt: plan.receipt,
      replayed: false,
      at,
    };
  }

  /** Перевірка перед погашенням: баланс, термін, чи можна платити. */
  async balance(code: string, now: Date = this.clock.now()): Promise<CertificateBalanceView> {
    const normalized = normalizeCertificateCode(code);
    const certificate = await this.repository.findByCode(normalized);
    if (!certificate) return { found: false, code: normalized };

    const expired = certificate.isExpired(now) || certificate.status === 'expired';
    let redeemable = true;
    try {
      assertRedeemable(certificate, now);
    } catch (error) {
      if (error instanceof CertificateRedemptionConflictError) redeemable = false;
      else throw error;
    }

    return {
      found: true,
      code: certificate.code,
      initialAmount: certificate.initialAmount,
      remainingBalance: certificate.remainingBalance,
      currency: certificate.currency,
      status: expired ? 'expired' : certificate.status,
      expiresAt: certificate.expiresAt,
      expired,
      redeemable,
    };
  }

  /** Історія погашень: для картки клієнта й адмін-звіту. */
  async history(filter: { certificateId?: string; code?: string } = {}) {
    return this.ledger.list(filter);
  }
}
