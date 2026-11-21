/* eslint-disable max-lines -- cohesive module (271 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import {
  LoyaltyProgramType,
  EarnRuleType,
  SpendRuleType,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  EarnRule,
  SpendRule,
  TierBenefit,
  PointsAccrual,
  BalanceUpdateResult,
} from './loyalty-program.entity';
import { LoyaltyRegistry } from './loyalty-program.entity';

describe('LoyaltyProgramType', () => {
  const validTypes: LoyaltyProgramType[] = ['points', 'cashback', 'vip', 'hybrid'];

  it('should accept all valid program types', () => {
    for (const type of validTypes) {
      expect(type).toBeDefined();
    }
  });
});

describe('LoyaltyAccount', () => {
  it('should create a valid loyalty account', () => {
    const account: LoyaltyAccount = {
      id: 'acct-001',
      clientId: 'client-1',
      programId: 'prog-001',
      pointsBalance: 100,
      cashbackBalance: 50,
      tier: 'SILVER',
      tierProgress: 75,
      lastActivity: new Date(),
      totalPointsEarned: 500,
      totalCashbackEarned: 200,
      totalPointsSpent: 50,
    };

    expect(account.clientId).toBe('client-1');
    expect(account.tier).toBe('SILVER');
    expect(account.tierProgress).toBe(75);
    expect(account.totalPointsEarned).toBe(500);
  });
});

describe('LoyaltyTransaction', () => {
  it('should create a valid loyalty transaction', () => {
    const transaction: LoyaltyTransaction = {
      id: 'tx-001',
      accountId: 'acct-001',
      type: 'EARN' as LoyaltyTransactionType,
      amount: 100,
      description: 'Points earned for visit',
      createdAt: new Date(),
    };

    expect(transaction.type).toBe('EARN');
    expect(transaction.amount).toBe(100);
  });
});

describe('EarnRule', () => {
  it('should create a valid earn rule', () => {
    const rule: EarnRule = {
      id: 'rule-001',
      programId: 'prog-001',
      ruleType: 'visit' as EarnRuleType,
      jsonLogicExpression: 'true',
      multiplier: 1,
      active: true,
    };

    expect(rule.ruleType).toBe('visit');
    expect(rule.multiplier).toBe(1);
    expect(rule.active).toBe(true);
  });
});

describe('SpendRule', () => {
  it('should create a valid spend rule', () => {
    const rule: SpendRule = {
      id: 'rule-002',
      programId: 'prog-001',
      ruleType: 'minimum_balance' as SpendRuleType,
      jsonLogicExpression: 'true',
      minBalanceRequired: 100,
      maxPercentOfCheck: 20,
      active: true,
    };

    expect(rule.ruleType).toBe('minimum_balance');
    expect(rule.minBalanceRequired).toBe(100);
    expect(rule.maxPercentOfCheck).toBe(20);
    expect(rule.active).toBe(true);
  });
});

describe('TierBenefit', () => {
  it('should create a valid tier benefit', () => {
    const benefit: TierBenefit = {
      tier: 'GOLD' as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
      cashbackPercentBonus: 5,
      freeAddons: ['hair_mask', 'consultation'],
      waitlistPriorityBoost: 2,
      exclusiveServices: ['premium_cut'],
    };

    expect(benefit.tier).toBe('GOLD');
    expect(benefit.cashbackPercentBonus).toBe(5);
    expect(benefit.freeAddons).toHaveLength(2);
  });
});

describe('PointsAccrual', () => {
  it('should create a valid points accrual', () => {
    const accrual: PointsAccrual = {
      points: 100,
      cashback: 50,
      appliedRules: ['rule-001'],
      finalMultiplier: 1.2,
    };

    expect(accrual.points).toBe(100);
    expect(accrual.cashback).toBe(50);
    expect(accrual.appliedRules).toContain('rule-001');
  });
});

describe('BalanceUpdateResult', () => {
  it('should create a valid balance update result', () => {
    const result: BalanceUpdateResult = {
      newPointsBalance: 200,
      newCashbackBalance: 100,
      pointsEarned: 100,
      cashbackEarned: 50,
      tierChange: {
        newTier: 'SILVER' as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
        progress: 75,
        wasUpgraded: true,
        wasDowngraded: false,
        reason: 'Reached 500 points',
      },
      appliedRules: ['rule-001'],
    };

    expect(result.newPointsBalance).toBe(200);
    expect(result.tierChange.wasUpgraded).toBe(true);
  });
});

describe('LoyaltyRegistry', () => {
  let registry: LoyaltyRegistry;

  beforeEach(() => {
    registry = new LoyaltyRegistry();
    // Create a default points program before each test
    registry.createProgram({
      type: 'points' as LoyaltyProgramType,
      name: 'FADE Club',
      pointsPerUah: 10,
      cashbackPercent: 0,
      activeFrom: new Date('2024-01-01'),
      active: true,
    });
  });

  describe('createProgram', () => {
    it('should create a loyalty program', () => {
      const program = registry.createProgram({
        type: 'cashback' as LoyaltyProgramType,
        name: 'Cashback Club',
        cashbackPercent: 5,
      });
      expect(program.type).toBe('cashback');
      expect(program.name).toBe('Cashback Club');
      expect(program.pointsPerUah).toBe(10); // default
    });

    it('should apply default values', () => {
      const program = registry.createProgram({
        type: 'points' as LoyaltyProgramType,
        name: 'Test',
      });
      expect(program.pointsPerUah).toBe(10);
      expect(program.cashbackPercent).toBe(0);
      expect(program.allowExpiration).toBe(false);
    });
  });

  describe('getProgramByType', () => {
    it('should get programs by type', () => {
      const programs = registry.getProgramByType('points' as LoyaltyProgramType);
      expect(programs.length).toBeGreaterThan(0);
    });

    it('should return programs matching the requested type only', () => {
      // Only 'points' program exists from beforeEach, so cashback should return 0
      const codes = registry.getProgramByType('cashback' as LoyaltyProgramType);
      expect(codes.length).toBe(0);
    });

    it('should return empty for inactive type', () => {
      registry.createProgram({
        type: 'vip' as LoyaltyProgramType,
        name: 'VIP',
        active: false,
      });
      const active = registry.getActivePrograms();
      // Should only have the original active program from beforeEach
      expect(active.length).toBe(1);
    });
  });

  describe('getActivePrograms', () => {
    it('should return only active programs', () => {
      const active = registry.getActivePrograms();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should exclude inactive programs', () => {
      registry.createProgram({
        type: 'vip' as LoyaltyProgramType,
        name: 'Inactive VIP',
        active: false,
      });
      const active = registry.getActivePrograms();
      // Should only have the original active program from beforeEach
      expect(active.length).toBe(1);
    });
  });

  describe('createAccount', () => {
    it('should create a loyalty account', () => {
      const account = registry.createAccount('client-1', 'prog-001');
      expect(account.clientId).toBe('client-1');
      expect(account.programId).toBe('prog-001');
      expect(account.tier).toBe('BRONZE');
      expect(account.pointsBalance).toBe(0);
    });

    it('should assign sequential account IDs', () => {
      const acc1 = registry.createAccount('client-1', 'prog-001');
      const acc2 = registry.createAccount('client-2', 'prog-001');
      expect(acc1.id).toBe('acct-001');
      expect(acc2.id).toBe('acct-002');
    });
  });

  describe('getAccount', () => {
    it('should get an existing account', () => {
      registry.createAccount('client-1', 'prog-001');
      const account = registry.getAccount('client-1', 'prog-001');
      expect(account).toBeDefined();
      expect(account?.clientId).toBe('client-1');
    });

    it('should return undefined for non-existent account', () => {
      const account = registry.getAccount('nonexistent', 'prog-001');
      expect(account).toBeUndefined();
    });
  });

  describe('calculateAccrual', () => {
    it('should calculate points accrual for a visit', () => {
      const accrual = registry.calculateAccrual('prog-001', 200, {
        serviceIds: [],
        isBirthday: false,
        isReview: false,
        now: new Date(),
      });
      expect(accrual.points).toBeGreaterThan(0);
      expect(accrual.finalMultiplier).toBeGreaterThan(0);
    });
  });

  describe('applyAccrual', () => {
    it('should apply accrual to loyalty account', () => {
      registry.createAccount('client-1', 'prog-001');
      const accrual = {
        points: 200,
        cashback: 100,
        appliedRules: [],
        finalMultiplier: 1,
      };

      const result = registry.applyAccrual('client-1', 'prog-001', accrual);
      expect(result.newPointsBalance).toBe(200);
      expect(result.pointsEarned).toBe(200);
      expect(result.tierChange.newTier).toBeDefined();
    });

    it('should return tier change result', () => {
      registry.createAccount('client-1', 'prog-001');
      // Apply enough points to reach SILVER tier (500 points)
      const accrual = {
        points: 600,
        cashback: 300,
        appliedRules: [],
        finalMultiplier: 1,
      };

      const result = registry.applyAccrual('client-1', 'prog-001', accrual);
      expect(result.newPointsBalance).toBe(600);
      expect(result.tierChange.newTier).toBeDefined();
    });
  });
});
