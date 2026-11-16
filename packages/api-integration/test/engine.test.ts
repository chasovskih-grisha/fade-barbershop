import { createApiResponse, validateWebhook, WebhookPayloadSchema, withRetry } from '../src/index';

describe('API & Integration Services Specialist', () => {
  it('creates success and error API responses correctly with meta', () => {
    const successRes = createApiResponse({ id: '123' }, undefined, { requestId: 'req-1' });
    expect(successRes.success).toBe(true);
    expect(successRes.data).toEqual({ id: '123' });
    expect(successRes.meta?.requestId).toBe('req-1');
    expect(successRes.meta?.timestamp).toBeDefined();

    const errorRes = createApiResponse(undefined, { code: 'BAD_REQUEST', message: 'Invalid params' });
    expect(errorRes.success).toBe(false);
    expect(errorRes.error?.code).toBe('BAD_REQUEST');
    expect(errorRes.meta?.timestamp).toBeDefined();
  });

  it('retries failing async operations successfully', async () => {
    let attempts = 0;
    const failingFn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await withRetry(failingFn, { retries: 3, minTimeout: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('validates webhook payloads securely with Zod and signature checking', () => {
    const validData = {
      event: 'booking.created',
      timestamp: Date.now(),
      data: { bookingId: 'b-1' },
      signature: 'valid-sig'
    };

    const result = validateWebhook(validData, 'valid-sig', (p: any) => p.signature === 'valid-sig');
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
