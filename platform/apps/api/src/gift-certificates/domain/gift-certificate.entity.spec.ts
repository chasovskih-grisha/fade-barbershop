import { GiftCertificate } from './gift-certificate.entity';

describe('GiftCertificate Entity', () => {
  const now = new Date('2026-06-01T10:00:00Z');

  it('should create a new active gift certificate', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 1000,
      currency: 'UAH',
      validityMonths: 12,
      purchaserPhone: '+380501112233',
      now,
    });

    expect(cert.id).toBe('gc-1');
    expect(cert.code).toBe('FADE-1000');
    expect(cert.initialAmount).toBe(1000);
    expect(cert.remainingBalance).toBe(1000);
    expect(cert.currency).toBe('UAH');
    expect(cert.status).toBe('active');
    expect(cert.expiresAt.getFullYear()).toBe(2027);
  });

  it('should reject non-positive initial amount', () => {
    expect(() =>
      GiftCertificate.createNew({
        id: 'gc-2',
        code: 'BAD-0',
        initialAmount: 0,
        now,
      })
    ).toThrow('Gift certificate initial amount must be greater than zero');
  });

  it('should allow partial redemption and update status', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 1000,
      now,
    });

    const res = cert.redeem(400, now);
    expect(res.redeemedAmount).toBe(400);
    expect(res.remainingBalance).toBe(600);
    expect(cert.remainingBalance).toBe(600);
    expect(cert.status).toBe('partially_used');
  });

  it('should allow full redemption and set status to used', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 1000,
      now,
    });

    const res = cert.redeem(1000, now);
    expect(res.redeemedAmount).toBe(1000);
    expect(res.remainingBalance).toBe(0);
    expect(cert.status).toBe('used');
  });

  it('should cap redemption amount at remaining balance', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 500,
      now,
    });

    const res = cert.redeem(800, now);
    expect(res.redeemedAmount).toBe(500);
    expect(res.remainingBalance).toBe(0);
    expect(cert.status).toBe('used');
  });

  it('should reject redemption if expired', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 1000,
      validityMonths: 1,
      now,
    });

    const future = new Date('2026-08-01T10:00:00Z');
    expect(() => cert.redeem(100, future)).toThrow('Gift certificate is expired');
    expect(cert.status).toBe('expired');
  });

  it('should reject redemption if already used or cancelled', () => {
    const cert = GiftCertificate.createNew({
      id: 'gc-1',
      code: 'FADE-1000',
      initialAmount: 500,
      now,
    });
    cert.redeem(500, now);
    expect(() => cert.redeem(100, now)).toThrow("Cannot redeem gift certificate in status 'used'");
  });
});
