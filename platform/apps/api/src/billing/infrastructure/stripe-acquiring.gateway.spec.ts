import { StripeAcquiringGateway } from './stripe-acquiring.gateway';
import * as crypto from 'crypto';

describe('StripeAcquiringGateway', () => {
  let gateway: StripeAcquiringGateway;

  beforeEach(() => {
    gateway = new StripeAcquiringGateway();
  });

  it('creates payment session with provider details', async () => {
    const result = await gateway.createPaymentSession({
      paymentId: 'pay-123',
      amount: 450,
      currency: 'UAH',
      traceId: 'trace-abc',
      successUrl: 'https://fade.com.ua/success',
      cancelUrl: 'https://fade.com.ua/cancel',
    });

    expect(result.providerSessionId).toContain('pay-123');
    expect(result.checkoutUrl).toContain('https://checkout.stripe.com/pay/');
  });

  it('processes refund with fee reversal successfully', async () => {
    const result = await gateway.refundPayment({
      providerSessionId: 'cs_test_pay-123',
      amount: 450,
      reason: 'Cancellation within policy window',
      traceId: 'trace-abc',
      feeReversalAmount: 43,
    });

    expect(result.refundId).toContain('re_fade_');
    expect(result.feeReversed).toBe(43);
  });

  it('verifies valid webhook signature within tolerance', () => {
    const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
    const secret = 'whsec_test_secret';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    const isValid = gateway.verifyWebhookSignature(payload, header, secret);
    expect(isValid).toBe(true);
  });

  it('rejects invalid webhook signature', () => {
    const payload = JSON.stringify({ id: 'evt_123' });
    const secret = 'whsec_test_secret';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const header = `t=${timestamp},v1=deadbeef`;

    const isValid = gateway.verifyWebhookSignature(payload, header, secret);
    expect(isValid).toBe(false);
  });

  it('rejects expired webhook timestamp outside tolerance', () => {
    const payload = JSON.stringify({ id: 'evt_123' });
    const secret = 'whsec_test_secret';
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
    const signedPayload = `${oldTimestamp}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const header = `t=${oldTimestamp},v1=${signature}`;

    const isValid = gateway.verifyWebhookSignature(payload, header, secret, 300);
    expect(isValid).toBe(false);
  });

  it('calculates tax and generates itemized invoice details on session creation', async () => {
    const result = await gateway.createPaymentSession({
      paymentId: 'pay-inv-1',
      amount: 1200,
      currency: 'UAH',
      traceId: 'trace-inv-1',
      successUrl: 'https://fade.com.ua/success',
      cancelUrl: 'https://fade.com.ua/cancel',
    });

    expect(result.invoice).toBeDefined();
    expect(result.invoice?.total).toBe(1200);
    expect(result.invoice?.taxRate).toBe(0.2);
    expect(result.invoice?.taxAmount).toBe(240);
    expect(result.invoice?.subtotal).toBe(960);
  });

  it('applies zero-rating tax when customer VAT ID is provided', async () => {
    const result = await gateway.createPaymentSession({
      paymentId: 'pay-inv-2',
      amount: 1000,
      currency: 'EUR',
      traceId: 'trace-inv-2',
      successUrl: 'https://fade.com.ua/success',
      cancelUrl: 'https://fade.com.ua/cancel',
      customerVatId: 'UA123456789',
    });

    expect(result.invoice).toBeDefined();
    expect(result.invoice?.customerVatId).toBe('UA123456789');
    expect(result.invoice?.taxRate).toBe(0.0);
    expect(result.invoice?.taxAmount).toBe(0);
    expect(result.invoice?.subtotal).toBe(1000);
  });

  it('verifies payment status successfully', async () => {
    const result = await gateway.verifyPaymentStatus({
      paymentId: 'pay-123',
      providerSessionId: 'cs_test_pay-123',
      traceId: 'trace-abc',
    });

    expect(result.status).toBe('succeeded');
  });
});
