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
}

export function createApiResponse<T>(data?: T, error?: { code: string; message: string; details?: any }): ApiResponse<T> {
  if (error) {
    return { success: false, error };
  }
  return { success: true, data };
}

export function validateWebhook(rawBody: unknown, expectedSignature: string, validator: (body: unknown) => boolean): { valid: boolean; payload?: WebhookPayload; error?: string } {
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
