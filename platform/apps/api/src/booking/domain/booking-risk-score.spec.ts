import { assessBookingRisk, buildReviewQueue, BookingRiskSignals } from './booking-risk-score';

const cleanSignals: BookingRiskSignals = {
  ipCountryCode: 'UA',
  phoneCountryCode: 'UA',
  deviceFingerprintEntropy: 0.8,
  emailDomainAgeDays: 365,
  bookingsLast24h: 1,
  distinctPhonesPerDevice: 1,
  isVpnOrProxy: false,
  isDatacenterIp: false,
};

describe('BookingRiskScore (T-4623)', () => {
  it('gives a clean request a low score and no deposit hold', () => {
    const result = assessBookingRisk(cleanSignals);
    expect(result.score).toBe(0);
    expect(result.tier).toBe('low');
    expect(result.requiresDepositHold).toBe(false);
    expect(result.depositPercent).toBe(0);
    expect(result.factors).toEqual([]);
  });

  it('flags a country mismatch and a low-entropy device as elevated', () => {
    const result = assessBookingRisk({
      ...cleanSignals,
      ipCountryCode: 'RU',
      deviceFingerprintEntropy: 0.1,
    });
    expect(result.score).toBe(40);
    expect(result.tier).toBe('elevated');
    expect(result.requiresDepositHold).toBe(false);
    expect(result.factors).toEqual(['ip-phone-country-mismatch', 'low-device-entropy']);
  });

  it('mandates a 50% deposit hold once the score passes the high threshold', () => {
    const result = assessBookingRisk({
      ...cleanSignals,
      ipCountryCode: 'RU',
      isVpnOrProxy: true,
      isDatacenterIp: true,
      bookingsLast24h: 9,
    });
    expect(result.score).toBe(70);
    expect(result.tier).toBe('high');
    expect(result.requiresDepositHold).toBe(true);
    expect(result.depositPercent).toBe(50);
  });

  it('caps the score at 100 and stacks every factor', () => {
    const result = assessBookingRisk({
      ipCountryCode: 'TR',
      phoneCountryCode: 'UA',
      deviceFingerprintEntropy: 0,
      emailDomainAgeDays: 1,
      bookingsLast24h: 20,
      distinctPhonesPerDevice: 5,
      isVpnOrProxy: true,
      isDatacenterIp: true,
    });
    expect(result.score).toBe(100);
    expect(result.tier).toBe('high');
    expect(result.factors).toHaveLength(7);
  });

  it('keeps an unknown email domain age neutral', () => {
    const withoutEmail: BookingRiskSignals = {
      ipCountryCode: 'UA',
      phoneCountryCode: 'UA',
      deviceFingerprintEntropy: 0.8,
      bookingsLast24h: 1,
      distinctPhonesPerDevice: 1,
      isVpnOrProxy: false,
      isDatacenterIp: false,
    };
    const withUnknown = assessBookingRisk(withoutEmail);
    const withNew = assessBookingRisk({ ...withoutEmail, emailDomainAgeDays: 5 });
    expect(withUnknown.score).toBe(0);
    expect(withNew.score).toBe(10);
    expect(withNew.factors).toContain('new-email-domain');
  });

  it('builds the admin review queue with the riskiest first', () => {
    const queue = buildReviewQueue([
      { bookingId: 'a', score: 70 },
      { bookingId: 'b', score: 30 },
      { bookingId: 'c', score: 90 },
      { bookingId: 'd', score: 65 },
    ]);
    expect(queue.map((b) => b.bookingId)).toEqual(['c', 'a']);
  });
});
