// Перевірка вхідного запиту еквайрингу до того, як він стане доменною подією:
// сире тіло + HMAC-підпис + конверт події. Винесено з контролера, щоб HTTP-шар
// лишався тонким, а кожна відмова мала одну причину й один статус.
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

export interface StripeEnvelope {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export interface VerifyFailure {
  ok: false;
  status: number;
  error:
    | 'webhook_secret_missing'
    | 'raw_body_missing'
    | 'signature_missing'
    | 'invalid_signature'
    | 'invalid_payload';
}

export type VerifyResult = { ok: true; envelope: StripeEnvelope; raw: string } | VerifyFailure;

export type SignatureVerifier = (payload: string, signature: string, secret: string) => boolean;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseEnvelope(raw: Buffer): StripeEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(raw.toString('utf8'));
    if (!isRecord(parsed)) return null;
    const { id, type, data } = parsed;
    if (typeof type !== 'string' || !type) return null;
    if (!isRecord(data) || !isRecord(data.object)) return null;
    return {
      ...(typeof id === 'string' && id ? { id } : {}),
      type,
      data: { object: data.object },
    };
  } catch {
    return null;
  }
}

export function verifyIncomingWebhook(
  request: RawBodyRequest<Request>,
  secret: string | undefined,
  verify: SignatureVerifier
): VerifyResult {
  if (!secret) return { ok: false, status: 503, error: 'webhook_secret_missing' };

  const raw = request.rawBody;
  if (!raw || raw.length === 0) return { ok: false, status: 400, error: 'raw_body_missing' };

  const header = request.headers['stripe-signature'];
  const signature = Array.isArray(header) ? header[0] : header;
  if (!signature) return { ok: false, status: 400, error: 'signature_missing' };

  const payload = raw.toString('utf8');
  if (!verify(payload, signature, secret)) {
    return { ok: false, status: 400, error: 'invalid_signature' };
  }

  const envelope = parseEnvelope(raw);
  if (!envelope) return { ok: false, status: 400, error: 'invalid_payload' };
  return { ok: true, envelope, raw: payload };
}
