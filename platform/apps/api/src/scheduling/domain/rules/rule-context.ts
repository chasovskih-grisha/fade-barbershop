import { RuleEngine, RuleContext, RuleResult, RuleDefinition, RuleType } from './rule-types';
import { RuleRegistry } from './rule-registry';
import type { AttendanceRepository } from '../../application/attendance-management.service';
import type { CancellationActorRole } from '../attendance-management';

/** Provider that builds RuleContext from domain state. */
export interface RuleContextProvider {
  /** Build RuleContext for a given appointment and client state. */
  buildContext(
    appointmentId: string,
    clientId: string,
    overrides?: Partial<RuleContext>
  ): RuleContext;
}

/** Default implementation that reads from attendance records and policies. */
export class DefaultRuleContextProvider implements RuleContextProvider {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  buildContext(
    appointmentId: string,
    clientId: string,
    overrides: Partial<RuleContext> = {}
  ): RuleContext {
    // Read attendance record (no-show/cancellation history).
    void this.repository.findById(appointmentId);

    // Base context; реальні значення приходять з overrides/read-моделей.
    const baseContext: RuleContext = {
      appointmentId,
      clientId,
      hoursUntilSlot: 0,
      clientNoShowCount: 0,
      depositPaid: false,
      appointmentStart: new Date(),
      now: this.now(),
      ...overrides,
    };

    return baseContext;
  }
}

/** Provider that gives cancellation-specific context. */
export interface CancellationContextProvider extends RuleContextProvider {
  /** Include cancellation-specific fields like actor role. */
  buildCancellationContext(
    appointmentId: string,
    clientId: string,
    actorRole: CancellationActorRole,
    overrides?: Partial<RuleContext>
  ): RuleContext;
}

/** Integration: Rule engine used by application services. */
export interface RuleEnginePort {
  /** Evaluate a rule type over context. */
  evaluate(type: RuleType, context: RuleContext): RuleResult;

  /** Get active rules by type. */
  getActiveRules(type: RuleType): RuleDefinition[];

  /** Seed default rules for testing/development. */
  seedDefaults(): void;
}

/** Lightweight rule engine implementation. */
export class LightweightRuleEngine implements RuleEnginePort {
  private readonly engine: RuleEngine;
  private readonly registry: RuleRegistry;
  private readonly contextProvider: RuleContextProvider;

  constructor(
    registry: RuleRegistry = new RuleRegistry(),
    contextProvider: RuleContextProvider = new DefaultRuleContextProvider(
      {} as any,
      () => new Date()
    )
  ) {
    this.registry = registry;
    this.contextProvider = contextProvider;
    this.engine = new RuleEngine(registry.getAll());
    // Seed default rules
    registry.seedDefaults();
  }

  evaluate(type: RuleType, context: RuleContext): RuleResult {
    return this.engine.evaluate(type, context);
  }

  getActiveRules(type: RuleType): RuleDefinition[] {
    return this.registry.getByType(type);
  }

  seedDefaults(): void {
    this.registry.seedDefaults();
  }
}
