import { z } from 'zod';

export const WebhookPayloadSchema = z.object({
  event: z.string().min(1),
  timestamp: z.number().int().positive(),
  data: z.record(z.any()),
  signature: z.string().min(1)
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId?: string;
  };
}

export function createApiResponse<T>(
  data?: T, 
  error?: { code: string; message: string; details?: any },
  meta?: { requestId?: string }
): ApiResponse<T> {
  const responseMeta = {
    timestamp: Date.now(),
    ...(meta?.requestId ? { requestId: meta.requestId } : {})
  };

  if (error) {
    return { success: false, error, meta: responseMeta };
  }
  return { success: true, data, meta: responseMeta };
}

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  factor?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const minTimeout = options.minTimeout ?? 100;
  const factor = options.factor ?? 2;

  let attempt = 0;
  let currentTimeout = minTimeout;

  while (true) {
    try {
      attempt++;
      return await fn();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, currentTimeout));
      currentTimeout *= factor;
    }
  }
}

export function validateWebhook(rawBody: unknown, expectedSignature: string, validator: (body: WebhookPayload) => boolean): { valid: boolean; payload?: WebhookPayload; error?: string } {
  const parseResult = WebhookPayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return { valid: false, error: `Invalid payload structure: ${parseResult.error.message}` };
  }

  const payload = parseResult.data;
  const isSigValid = validator(payload);
  if (!isSigValid) {
    return { valid: false, error: 'Invalid webhook signature' };
  }

  return { valid: true, payload };
}
