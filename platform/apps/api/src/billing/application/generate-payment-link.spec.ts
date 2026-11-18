import { GeneratePaymentLinkHandler } from './generate-payment-link.use-case';

describe('GeneratePaymentLinkHandler & Verification', () => {
  const secretKey = 'fade-secure-payment-secret-key';
  let handler: GeneratePaymentLinkHandler;

  beforeEach(() => {
    handler = new GeneratePaymentLinkHandler();
  });

  it('generates a secure payment link with valid HMAC signature and expiration', async () => {
    const result = await handler.handle({
      paymentId: 'pay-link-1',
      appointmentId: 'apt-link-1',
      amount: 750,
      currency: 'UAH',
      expiresInSeconds: 1800,
      traceId: 'trace-link-1',
      secretKey,
    });

    expect(result.paymentId).toBe('pay-link-1');
    expect(result.paymentLink).toContain('https://fade.com.ua/pay?data=');
    expect(result.signature).toBeDefined();

    // Parse out data and sig from link
    const url = new URL(result.paymentLink);
    const encodedData = url.searchParams.get('data')!;
    const sig = url.searchParams.get('sig')!;

    const verification = GeneratePaymentLinkHandler.verifyPaymentLink(
      encodedData,
      sig,
      secretKey,
      new Date('2026-11-11T12:00:00Z'),
    );

    expect(verification.valid).toBe(true);
    expect(verification.data?.amount).toBe(750);
    expect(verification.data?.paymentId).toBe('pay-link-1');
  });

  it('rejects tampered amount or signature', async () => {
    const result = await handler.handle({
      paymentId: 'pay-link-2',
      appointmentId: 'apt-link-2',
      amount: 750,
      currency: 'UAH',
      expiresInSeconds: 1800,
      traceId: 'trace-link-2',
      secretKey,
    });

    const url = new URL(result.paymentLink);
    const encodedData = url.searchParams.get('data')!;
    const sig = url.searchParams.get('sig')!;

    // Tamper with data (e.g. changing amount in decoded payload and re-encoding)
    const tamperedData = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
    tamperedData.amount = 10; // Tampering amount to 10 UAH
    const tamperedEncoded = Buffer.from(JSON.stringify(tamperedData), 'utf8').toString('base64url');

    const verification = GeneratePaymentLinkHandler.verifyPaymentLink(
      tamperedEncoded,
      sig, // original signature won't match tampered payload
      secretKey,
      new Date('2026-11-11T12:00:00Z'),
    );

    expect(verification.valid).toBe(false);
    expect(verification.error).toContain('Invalid HMAC signature');
  });

  it('rejects expired payment links', async () => {
    const result = await handler.handle({
      paymentId: 'pay-link-3',
      appointmentId: 'apt-link-3',
      amount: 500,
      currency: 'UAH',
      expiresInSeconds: 60, // 1 minute
      traceId: 'trace-link-3',
      secretKey,
    });

    const url = new URL(result.paymentLink);
    const encodedData = url.searchParams.get('data')!;
    const sig = url.searchParams.get('sig')!;

    // Check with current time 2 minutes later
    const futureTime = new Date(result.expiresAt.getTime() + 120 * 1000);
    const verification = GeneratePaymentLinkHandler.verifyPaymentLink(
      encodedData,
      sig,
      secretKey,
      futureTime,
    );

    expect(verification.valid).toBe(false);
    expect(verification.error).toContain('Payment link has expired');
  });
});
