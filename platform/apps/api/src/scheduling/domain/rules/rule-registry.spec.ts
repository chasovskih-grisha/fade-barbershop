/* eslint-disable max-lines -- cohesive module (150 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/** T-4556: Специ тестів для RuleRegistry. */
import { RuleRegistry, RuleType } from './rule-registry';

describe('RuleRegistry', () => {
  let registry: RuleRegistry;

  beforeEach(() => {
    registry = new RuleRegistry();
  });

  describe('create', () => {
    it('should create a rule and assign an ID', () => {
      const rule = registry.create({
        type: 'booking' as RuleType,
        name: 'Test Booking Rule',
        expression: 'true',
      });
      expect(rule.id).toMatch(/^rule-\d+$/);
      expect(rule.name).toBe('Test Booking Rule');
      expect(rule.type).toBe('booking');
    });

    it('should increment ID for subsequent creates', () => {
      const rule1 = registry.create({ type: 'booking', name: 'Rule 1', expression: 'true' });
      const rule2 = registry.create({ type: 'cancellation', name: 'Rule 2', expression: 'true' });
      expect(rule1.id).toBe('rule-1');
      expect(rule2.id).toBe('rule-2');
    });
  });

  describe('get', () => {
    it('should retrieve a rule by ID', () => {
      const created = registry.create({
        type: 'loyalty' as RuleType,
        name: 'Loyalty Rule',
        expression: 'true',
      });
      const retrieved = registry.get(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Loyalty Rule');
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = registry.get('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getByType', () => {
    it('should get rules by type', () => {
      registry.create({ type: 'booking', name: 'Booking 1', expression: 'true' });
      registry.create({ type: 'booking', name: 'Booking 2', expression: 'true' });
      registry.create({ type: 'cancellation', name: 'Cancellation 1', expression: 'true' });

      const bookingRules = registry.getByType('booking' as RuleType);
      expect(bookingRules.length).toBe(2);
    });

    it('should return empty array for type with no rules', () => {
      const cancellationRules = registry.getByType('unknown' as RuleType);
      expect(cancellationRules.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should update an existing rule', () => {
      const created = registry.create({
        type: 'pricing' as RuleType,
        name: 'Pricing Rule',
        expression: 'true',
        version: 1,
      });
      const updated = registry.update(created.id, {
        name: 'Updated Pricing Rule',
        expression: 'greaterThan([hoursUntilSlot], 1)',
      });
      expect(updated?.name).toBe('Updated Pricing Rule');
      expect(updated?.expression).toBe('greaterThan([hoursUntilSlot], 1)');
    });

    it('should return undefined for non-existent ID', () => {
      const updated = registry.update('non-existent', {
        name: 'Nope',
        expression: 'true',
      });
      expect(updated).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should remove an existing rule', () => {
      const created = registry.create({
        type: 'deposit' as RuleType,
        name: 'Deposit Rule',
        expression: 'true',
      });
      const removed = registry.remove(created.id);
      expect(removed).toBe(true);
      expect(registry.get(created.id)).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      const removed = registry.remove('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all rules', () => {
      registry.create({ type: 'booking', name: 'Booking 1', expression: 'true' });
      registry.create({ type: 'cancellation', name: 'Cancellation 1', expression: 'true' });

      const all = registry.getAll();
      expect(all.length).toBe(2);
    });
  });

  describe('countByType', () => {
    it('should count rules by type', () => {
      registry.create({ type: 'booking', name: 'Booking 1', expression: 'true' });
      registry.create({ type: 'booking', name: 'Booking 2', expression: 'true' });
      registry.create({ type: 'cancellation', name: 'Cancellation 1', expression: 'true' });

      expect(registry.countByType('booking' as RuleType)).toBe(2);
      expect(registry.countByType('cancellation' as RuleType)).toBe(1);
      expect(registry.countByType('loyalty' as RuleType)).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing type', () => {
      registry.create({
        type: 'notification' as RuleType,
        name: 'Notification Rule',
        expression: 'true',
      });
      expect(registry.exists('notification' as RuleType)).toBe(true);
    });

    it('should return false for non-existing type', () => {
      expect(registry.exists('nonexistent' as RuleType)).toBe(false);
    });
  });

  describe('seedDefaults', () => {
    it('should seed default rules for all types', () => {
      registry.seedDefaults();

      // Check that rules were created for each type
      const types: RuleType[] = [
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

      for (const type of types) {
        expect(registry.exists(type)).toBe(true);
      }
    });

    it('should create rules with correct expressions', () => {
      registry.seedDefaults();

      const bookingRules = registry.getByType('booking' as RuleType);
      expect(bookingRules.length).toBeGreaterThan(0);

      // Check that at least one booking rule has a meaningful expression
      const hasExpression = bookingRules.some((r) => r.expression && r.expression !== 'true');
      expect(hasExpression).toBe(true);
    });
  });
});
