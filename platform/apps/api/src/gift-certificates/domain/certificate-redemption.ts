/* eslint-disable max-lines -- cohesive module (128 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/**
 * T-4456: погашення сертифіката барбером — політика без Nest/Prisma.
 *
 * Барбер показує код клієнта (ввід) або сканує OCR; політика:
 *  - нормалізує код (пробіли/регістр — типові помилки ручного вводу й OCR);
 *  - перевіряє баланс і термін до списання, а не після;
 *  - покриває частину суми послуги або всю суму, решта — `dueAmount`;
 *  - чек має джерело `gift_certificate`, щоб каса не подвоїла оплату;
 *  - ідемпотентність скану: один `idempotencyKey` — один транш
 *    (подвійний скан того самого коду не списує двічі).
 */

export type RedemptionSource = 'gift_certificate';

export class CertificateRedemptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CertificateRedemptionError';
  }
}

export class CertificateRedemptionConflictError extends CertificateRedemptionError {
  constructor(message: string) {
    super(message);
    this.name = 'CertificateRedemptionConflictError';
  }
}

export class CertificateRedemptionForbiddenError extends CertificateRedemptionError {
  constructor(message: string) {
    super(message);
    this.name = 'CertificateRedemptionForbiddenError';
  }
}

/** Мінімальний стан сертифіката, потрібний політиці. */
export interface RedeemableCertificate {
  id: string;
  code: string;
  currency: string;
  remainingBalance: number;
  status: 'active' | 'partially_used' | 'used' | 'expired' | 'cancelled';
  expiresAt: Date;
  isExpired(now: Date): boolean;
}

export interface CertificateReceipt {
  source: RedemptionSource;
  certificateId: string;
  certificateCode: string;
  appointmentTotal: number;
  coveredAmount: number;
  dueAmount: number;
  currency: string;
  appointmentId: string | null;
}

export interface CertificateRedemptionPlan {
  coveredAmount: number;
  dueAmount: number;
  receipt: CertificateReceipt;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

/** OCR і ручний ввід: прибираємо пробіли, дефіси й регістр. */
export function normalizeCertificateCode(raw: string): string {
  return raw
    .replace(/[\s-]+/g, '')
    .trim()
    .toUpperCase();
}

export function certificateRedemptionKey(certificateCode: string, idempotencyKey: string): string {
  return `certificate:${normalizeCertificateCode(certificateCode)}:${idempotencyKey.trim()}`;
}

/**
 * Перевірка «чи можна цим сертифікатом платити»: термін і статус.
 * Баланс перевіряється окремо, бо нульовий баланс — конфлікт, а не 404.
 */
export function assertRedeemable(certificate: RedeemableCertificate, now: Date): void {
  if (certificate.isExpired(now) || certificate.status === 'expired') {
    throw new CertificateRedemptionConflictError('Gift certificate is expired');
  }
  if (certificate.status === 'cancelled') {
    throw new CertificateRedemptionConflictError('Gift certificate is cancelled');
  }
  if (certificate.status === 'used' || certificate.remainingBalance <= 0) {
    throw new CertificateRedemptionConflictError('Gift certificate has no balance left');
  }
}

/**
 * Скільки сертифікат покриє і скільки лишиться клієнту.
 * `amount` — сума, яку барбер хоче закрити сертифікатом (не більше суми чека).
 */
export function planCertificateRedemption(input: {
  certificate: RedeemableCertificate;
  now: Date;
  amount: number;
  appointmentTotal: number;
  appointmentId?: string | null;
}): CertificateRedemptionPlan {
  const { certificate, now } = input;

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new CertificateRedemptionError('Redemption amount must be greater than zero');
  }
  if (!Number.isFinite(input.appointmentTotal) || input.appointmentTotal <= 0) {
    throw new CertificateRedemptionError('Appointment total must be greater than zero');
  }

  assertRedeemable(certificate, now);

  const amount = round2(input.amount);
  const appointmentTotal = round2(input.appointmentTotal);
  if (amount > appointmentTotal) {
    throw new CertificateRedemptionError('Redemption amount cannot exceed the appointment total');
  }

  const coveredAmount = round2(Math.min(amount, certificate.remainingBalance));
  if (coveredAmount <= 0) {
    throw new CertificateRedemptionConflictError('Gift certificate has no balance left');
  }
  const dueAmount = round2(appointmentTotal - coveredAmount);

  return {
    coveredAmount,
    dueAmount,
    receipt: {
      source: 'gift_certificate',
      certificateId: certificate.id,
      certificateCode: certificate.code,
      appointmentTotal,
      coveredAmount,
      dueAmount,
      currency: certificate.currency,
      appointmentId: input.appointmentId ?? null,
    },
  };
}

export interface CertificateRedemptionRecord {
  certificateId: string;
  certificateCode: string;
  coveredAmount: number;
  remainingBalance: number;
  status: string;
  appointmentTotal: number;
  dueAmount: number;
  appointmentId: string | null;
  idempotencyKey: string;
  by: string;
  at: Date;
  receipt: CertificateReceipt;
  source: RedemptionSource;
}

/** Чи може актор погашати сертифікат: барбер у кріслі або адмін. */
export function assertRedemptionActor(role: string): void {
  if (role !== 'barber' && role !== 'admin') {
    throw new CertificateRedemptionForbiddenError(
      'Only a barber or admin can redeem a gift certificate'
    );
  }
}
