import * as crypto from 'crypto';

export interface GeneratePaymentLinkInput {
  paymentId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  expiresInSeconds?: number;
  baseUrl?: string;
  traceId: string;
  secretKey: string;
}

export interface GeneratePaymentLinkResult {
  paymentId: string;
  paymentLink: string;
  expiresAt: Date;
  signature: string;
}

export class GeneratePaymentLinkHandler {
  async handle(input: GeneratePaymentLinkInput): Promise<GeneratePaymentLinkResult> {
    const expiresInSeconds = input.expiresInSeconds ?? 3600; // default 1 hour timeout
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);
    const baseUrl = input.baseUrl || 'https://fade.com.ua/pay';

    const payload = JSON.stringify({
      paymentId: input.paymentId,
      appointmentId: input.appointmentId,
      amount: input.amount,
      currency: input.currency,
      expiresAt: expiresAt.toISOString(),
      traceId: input.traceId,
    });

    const signature = crypto
      .createHmac('sha256', input.secretKey)
      .update(payload, 'utf8')
      .digest('hex');

    const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
    const paymentLink = `${baseUrl}?data=${encodedPayload}&sig=${signature}`;

    return {
      paymentId: input.paymentId,
      paymentLink,
      expiresAt,
      signature,
    };
  }

  public static verifyPaymentLink(
    encodedData: string,
    signature: string,
    secretKey: string,
    currentTime: Date = new Date(),
  ): { valid: boolean; data?: { paymentId: string; appointmentId: string; amount: number; currency: string; expiresAt: string; traceId: string }; error?: string } {
    try {
      const payloadJson = Buffer.from(encodedData, 'base64url').toString('utf8');
      const data = JSON.parse(payloadJson);

      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payloadJson, 'utf8')
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        return { valid: false, error: 'Invalid HMAC signature — link may have been tampered with.' };
      }

      const expiresAtDate = new Date(data.expiresAt);
      if (currentTime.getTime() > expiresAtDate.getTime()) {
        return { valid: false, error: 'Payment link has expired.' };
      }

      return { valid: true, data };
    } catch {
      return { valid: false, error: 'Malformed payment link payload or signature.' };
    }
  }
}
