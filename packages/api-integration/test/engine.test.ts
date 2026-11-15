import { createApiResponse, validateWebhook, WebhookPayloadSchema } from '../src/index';

describe('API & Integration Services Specialist', () => {
  it('creates success and error API responses correctly', () => {
    const successRes = createApiResponse({ id: '123' });
    expect(successRes.success).toBe(true);
    expect(successRes.data).toEqual({ id: '123' });

    const errorRes = createApiResponse(undefined, { code: 'BAD_REQUEST', message: 'Invalid params' });
    expect(errorRes.success).toBe(false);
    expect(errorRes.error?.code).toBe('BAD_REQUEST');
  });

  it('validates webhook payloads securely with Zod and signature checking', () => {
    const validData = {
      event: 'booking.created',
      timestamp: Date.now(),
      data: { bookingId: 'b-1' },
      signature: 'valid-sig'
    };

    const result = validateWebhook(validData, 'valid-sig', (p) => p.signature === 'valid-sig');
    expect(result.valid).toBe(true);
    expect(result.payload?.event).toBe('booking.created');

    const invalidResult = validateWebhook({ event: '' }, 'valid-sig', () => true);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain('Invalid payload structure');

    const badSigResult = validateWebhook(validData, 'wrong-sig', () => false);
    expect(badSigResult.valid).toBe(false);
    expect(badSigResult.error).toBe('Invalid webhook signature');
  });
});
