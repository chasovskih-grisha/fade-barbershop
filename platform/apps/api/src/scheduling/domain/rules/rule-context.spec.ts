/* eslint-disable max-lines -- cohesive module (112 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/** T-4556: Специ тестів для RuleContext та провайдерів. */
import { RuleContext, RuleResult } from './rule-types';
import { DefaultRuleContextProvider } from './rule-context';
import { AttendanceRepository } from '../../application/infra/infra';

describe('RuleContext', () => {
  it('should accept minimal context', () => {
    const context: RuleContext = {
      appointmentId: 'appt-1',
      clientId: 'client-1',
    };
    expect(context.appointmentId).toBe('appt-1');
    expect(context.clientId).toBe('client-1');
  });

  it('should accept full context with all fields', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const context: RuleContext = {
      appointmentId: 'appt-1',
      clientId: 'client-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      serviceId: 'svc-1',
      policyId: 'pol-1',
      hoursUntilSlot: 48,
      clientNoShowCount: 2,
      depositPaid: true,
      policyConfig: { percent: 10, rounding: 5 },
      appointmentStart: now,
      now,
    };
    expect(context.appointmentId).toBe('appt-1');
    expect(context.hoursUntilSlot).toBe(48);
    expect(context.clientNoShowCount).toBe(2);
    expect(context.depositPaid).toBe(true);
    expect(context.now).toBe(now);
  });

  it('should accept partial context', () => {
    const context: RuleContext = {
      appointmentId: 'appt-1',
    };
    expect(context.appointmentId).toBe('appt-1');
    expect(context.clientId).toBeUndefined();
  });
});

describe('RuleResult', () => {
  it('should create result with allowed=true', () => {
    const result: RuleResult = { allowed: true, ruleVersion: 1 };
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should create result with allowed=false and reason', () => {
    const result: RuleResult = { allowed: false, reason: 'Too soon to cancel', ruleVersion: 1 };
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Too soon to cancel');
  });

  it('should accept modifications', () => {
    const result: RuleResult = {
      allowed: true,
      modifications: { depositPaid: true, clientNoShowCount: 0 },
      ruleVersion: 1,
    };
    expect(result.modifications).toEqual({ depositPaid: true, clientNoShowCount: 0 });
  });
});

describe('DefaultRuleContextProvider', () => {
  let provider: DefaultRuleContextProvider;
  let mockRepository: jest.Mocked<AttendanceRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<AttendanceRepository>;

    provider = new DefaultRuleContextProvider(mockRepository);
  });

  describe('buildContext', () => {
    it('should build context with appointmentId and clientId', () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);
      const context = provider.buildContext('appt-123', 'client-456');
      expect(context.appointmentId).toBe('appt-123');
      expect(context.clientId).toBe('client-456');
    });

    it('should include hoursUntilSlot as 0 by default', () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);
      const context = provider.buildContext('appt-123', 'client-456');
      // Default is 0 since we can't compute without appointment time
      expect(context.hoursUntilSlot).toBe(0);
    });

    it('should include clientNoShowCount as 0 by default', () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);
      const context = provider.buildContext('appt-123', 'client-456');
      expect(context.clientNoShowCount).toBe(0);
    });

    it('should include depositPaid as false by default', () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);
      const context = provider.buildContext('appt-123', 'client-456');
      expect(context.depositPaid).toBe(false);
    });

    it('should include now from clock', () => {
      const context = provider.buildContext('appt-123', 'client-456');
      // The provider uses its internal clock, which defaults to new Date()
      expect(context.now).toBeInstanceOf(Date);
    });

    it('should merge overrides correctly', () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);
      const context = provider.buildContext('appt-123', 'client-456', {
        hoursUntilSlot: 24,
        clientNoShowCount: 1,
        depositPaid: true,
      });
      expect(context.hoursUntilSlot).toBe(24);
      expect(context.clientNoShowCount).toBe(1);
      expect(context.depositPaid).toBe(true);
    });
  });
});
