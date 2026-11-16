import { AcquisitionRetentionEngine, Client } from '../src';

describe('AcquisitionRetentionEngine', () => {
  let engine: AcquisitionRetentionEngine;

  beforeEach(() => {
    engine = new AcquisitionRetentionEngine();
  });

  test('generates unique referral code', () => {
    const code = engine.generateReferralCode('John Doe');
    expect(code).toMatch(/^FADE-JOHN-\d{4}$/);
  });

  test('processes referral correctly with points and credit rewards', () => {
    const referrer: Client = {
      id: 'c1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '555-0100',
      createdAt: new Date(),
      totalVisits: 3,
      totalSpent: 120,
      referralCode: 'FADE-ALIC-1234',
      loyaltyTier: 'BRONZE',
      pointsBalance: 100
    };

    const result = engine.processReferral(referrer, 'Bob Jones', 'bob@example.com', '555-0200');
    expect(result.newClient.referredBy).toBe('FADE-ALIC-1234');
    expect(result.newClient.pointsBalance).toBe(50);
    expect(result.updatedReferrer.pointsBalance).toBe(250);
    expect(result.reward.referrerCredit).toBe(15.00);
  });

  test('calculates tiered referral rewards correctly for VIP tier', () => {
    const vipReferrer: Client = {
      id: 'c_vip',
      name: 'Victoria Vance',
      email: 'victoria@example.com',
      phone: '555-9999',
      createdAt: new Date(),
      totalVisits: 22,
      totalSpent: 900,
      referralCode: 'FADE-VICT-9999',
      loyaltyTier: 'VIP',
      pointsBalance: 1000
    };

    const reward = engine.calculateTieredReferralReward(vipReferrer);
    expect(reward.referrerCredit).toBe(30.00); // 15 * 2.0
    expect(reward.referrerPoints).toBe(300); // 150 * 2.0

    const result = engine.processReferral(vipReferrer, 'Newbie', 'new@example.com', '555-8888');
    expect(result.updatedReferrer.pointsBalance).toBe(1300);
  });

  test('evaluates loyalty tiers correctly', () => {
    const bronzeClient: Client = {
      id: 'c2',
      name: 'Charlie',
      email: 'charlie@example.com',
      phone: '555-0300',
      createdAt: new Date(),
      totalVisits: 2,
      totalSpent: 60,
      referralCode: 'FADE-CHAR-1111',
      loyaltyTier: 'BRONZE',
      pointsBalance: 0
    };
    expect(engine.evaluateLoyaltyTier(bronzeClient).loyaltyTier).toBe('BRONZE');

    const vipClient: Client = {
      id: 'c3',
      name: 'David',
      email: 'david@example.com',
      phone: '555-0400',
      createdAt: new Date(),
      totalVisits: 25,
      totalSpent: 1000,
      referralCode: 'FADE-DAVI-2222',
      loyaltyTier: 'BRONZE',
      pointsBalance: 500
    };
    expect(engine.evaluateLoyaltyTier(vipClient).loyaltyTier).toBe('VIP');
  });

  test('identifies win-back campaigns and bonus points', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);

    const inactiveClient: Client = {
      id: 'c4',
      name: 'Eve',
      email: 'eve@example.com',
      phone: '555-0500',
      createdAt: new Date(),
      lastVisitDate: thirtyDaysAgo,
      totalVisits: 4,
      totalSpent: 160,
      referralCode: 'FADE-EVE-3333',
      loyaltyTier: 'BRONZE',
      pointsBalance: 20
    };

    const offer = engine.getWinBackOffer(inactiveClient, now);
    expect(offer).not.toBeNull();
    expect(offer?.discountPercentage).toBe(15);
    expect(offer?.bonusPoints).toBe(100);
  });

  test('classifies client retention segments accurately', () => {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000);

    const dormantClient: Client = {
      id: 'c5',
      name: 'Frank',
      email: 'frank@example.com',
      phone: '555-0600',
      createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      lastVisitDate: sixtyDaysAgo,
      totalVisits: 3,
      totalSpent: 100,
      referralCode: 'FADE-FRAN-4444',
      loyaltyTier: 'BRONZE',
      pointsBalance: 10
    };

    const recommendation = engine.classifyClientSegment(dormantClient, now);
    expect(recommendation.segment).toBe('DORMANT');
    expect(recommendation.suggestedOffer).toContain('25%');
  });

  test('checks birthday club reward correctly', () => {
    const birthday = new Date(1990, 5, 15); // June 15
    const todayMatch = new Date(2026, 5, 15, 10, 0, 0);
    const todayNoMatch = new Date(2026, 5, 16, 10, 0, 0);

    const client: Client = {
      id: 'c_bday',
      name: 'Grace',
      email: 'grace@example.com',
      phone: '555-0700',
      createdAt: new Date(),
      birthDate: birthday,
      totalVisits: 5,
      totalSpent: 200,
      referralCode: 'FADE-GRAC-5555',
      loyaltyTier: 'SILVER',
      pointsBalance: 150
    };

    const rewardMatch = engine.checkBirthdayReward(client, todayMatch);
    expect(rewardMatch).not.toBeNull();
    expect(rewardMatch?.discountPercentage).toBe(20);
    expect(rewardMatch?.freeService).toContain('Hot Towel');

    const rewardNoMatch = engine.checkBirthdayReward(client, todayNoMatch);
    expect(rewardNoMatch).toBeNull();
  });

  test('processes membership renewal and retention perks', () => {
    const client: Client = {
      id: 'c_member',
      name: 'Henry',
      email: 'henry@example.com',
      phone: '555-0800',
      createdAt: new Date(),
      membershipStatus: 'UNLIMITED_MONTHLY',
      totalVisits: 12,
      totalSpent: 450,
      referralCode: 'FADE-HENR-6666',
      loyaltyTier: 'GOLD',
      pointsBalance: 400
    };

    const renewal = engine.processMembershipRenewal(client, 6);
    expect(renewal.renewed).toBe(true);
    expect(renewal.loyaltyBonusPoints).toBe(250);
    expect(renewal.discountApplied).toBe(0.10);
  });

  test('evaluates and processes referral milestones correctly', () => {
    const client: Client = {
      id: 'c_ref',
      name: 'Ian',
      email: 'ian@example.com',
      phone: '555-0900',
      createdAt: new Date(),
      totalVisits: 8,
      totalSpent: 300,
      referralCode: 'FADE-IAN_-7777',
      loyaltyTier: 'SILVER',
      pointsBalance: 200
    };

    const milestone1 = engine.getReferralMilestone(3);
    expect(milestone1).not.toBeNull();
    expect(milestone1?.milestoneName).toBe('Ambassador');
    expect(milestone1?.bonusPoints).toBe(350);

    const result = engine.processReferralMilestoneBonus(client, 3);
    expect(result.rewardGranted).toBe(true);
    expect(result.updatedClient.pointsBalance).toBe(550);
    expect(result.milestone?.unlockedPerk).toContain('Beard Trim');
  });
});
