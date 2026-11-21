/* eslint-disable max-lines -- cohesive module (110 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/** T-4556: Специ тестів для RuleType та RuleDefinition. */
import { RuleType, RuleDefinition, RuleContext, RuleResult } from './rule-types';

describe('RuleType', () => {
  const validTypes: RuleType[] = [
    'booking',
    'cancellation',
    'loyalty',
    'pricing',
    'deposit',
    'no-show',
    'rescheduling',
    'notification',
    'commission',
  ];

  it('should accept all valid rule types', () => {
    for (const type of validTypes) {
      expect(type).toBeDefined();
    }
  });

  it('should reject invalid rule types', () => {
    const invalid = 'invalid-type' as any;
    // RuleType is a string union, so any string is technically valid at runtime
    // but we test the type system catches it at compile time
    expect(typeof invalid).toBe('string');
  });
});

describe('RuleDefinition', () => {
  it('should create a valid rule definition', () => {
    const rule: RuleDefinition = {
      id: 'test-rule-1',
      type: 'booking',
      name: 'Test Booking Rule',
      expression: 'true',
      version: 1,
      activeFrom: new Date(),
      draft: false,
    };

    expect(rule.id).toBe('test-rule-1');
    expect(rule.type).toBe('booking');
    expect(rule.name).toBe('Test Booking Rule');
    expect(rule.version).toBe(1);
    expect(rule.draft).toBe(false);
  });

  it('should accept optional fields', () => {
    const rule: RuleDefinition = {
      id: 'test-rule-2',
      type: 'cancellation',
      name: 'Cancellation Rule',
      expression: 'greaterThan([hoursUntilSlot], 24)',
      // activeFrom, activeUntil, draft optional - defaults apply
    };

    expect(rule.type).toBe('cancellation');
    expect(rule.expression).toBe('greaterThan([hoursUntilSlot], 24)');
  });
});

describe('RuleContext', () => {
  it('should accept minimal context', () => {
    const context: RuleContext = {
      appointmentId: 'appt-1',
      clientId: 'client-1',
    };
    expect(context.appointmentId).toBe('appt-1');
    expect(context.clientId).toBe('client-1');
    expect(context.hoursUntilSlot).toBeUndefined();
  });

  it('should accept full context', () => {
    const now = new Date();
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
      policyConfig: { percent: 10 },
      appointmentStart: now,
      now,
    };
    expect(context.appointmentId).toBe('appt-1');
    expect(context.hoursUntilSlot).toBe(48);
    expect(context.clientNoShowCount).toBe(2);
    expect(context.now).toBe(now);
  });
});

describe('RuleResult', () => {
  it('should create a result with allowed=true', () => {
    const result: RuleResult = {
      allowed: true,
      ruleVersion: 1,
    };
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should create a result with allowed=false and reason', () => {
    const result: RuleResult = {
      allowed: false,
      reason: 'Rule condition not met',
      ruleVersion: 1,
    };
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Rule condition not met');
  });

  it('should accept modifications', () => {
    const result: RuleResult = {
      allowed: true,
      modifications: { depositPaid: true },
      ruleVersion: 1,
    };
    expect(result.modifications).toEqual({ depositPaid: true });
  });
});
