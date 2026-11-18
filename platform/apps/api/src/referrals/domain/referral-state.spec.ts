import { ReferralState } from './referral-state';

describe('ReferralState', () => {
  it('creates attribution successfully and prevents self-referral', () => {
    const now = new Date();
    const referral = ReferralState.createAttribution({
      refereeId: 'client-2',
      referrerId: 'client-1',
      referralCode: 'FADE123',
      attributedAt: now,
    });

    expect(referral.refereeId).toBe('client-2');
    expect(referral.referrerId).toBe('client-1');
    expect(referral.status).toBe('pending');

    expect(() =>
      ReferralState.createAttribution({
        refereeId: 'client-1',
        referrerId: 'client-1',
        referralCode: 'FADE123',
        attributedAt: now,
      })
    ).toThrow('Self-referral is prohibited');
  });

  it('completes referee visit and rewards referrer', () => {
    const now = new Date();
    const referral = ReferralState.createAttribution({
      refereeId: 'client-2',
      referrerId: 'client-1',
      referralCode: 'FADE123',
      attributedAt: now,
    });

    const result = referral.completeRefereeVisit(new Date(now.getTime() + 86400000));
    expect(result.rewarded).toBe(true);
    expect(referral.status).toBe('rewarded');
    expect(referral.completedAt).toBeDefined();
  });
});
