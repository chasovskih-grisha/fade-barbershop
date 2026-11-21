/** T-4556: Правилний двигун бізнес-правил.
 *
 * Доменні правила — конфіговані вирази JSON Logic, що評уються над контекстом запису.
 * Сервіс інтегрується з use cases: bookAppointment, cancelAppointment,
 * calculatePrice, calculateCommission та інші.
 *
 * Порти (repositories, policies, volume, events, clock) слідують патерну T-4560:
 * in-memory готові до Prisma-адаптера, годинник ін'єкціїваний.
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  RuleType,
  RuleDefinition,
  RuleContext,
  RuleResult,
  RuleEnginePort,
  LightweightRuleEngine,
  DefaultRuleContextProvider,
  RuleContextProvider,
} from '../domain/rules';
import {
  ATTENDANCE_REPOSITORY,
  ATTENDANCE_CLOCK,
  type AttendanceRepository,
  type AttendanceClock,
} from '../application/infra/infra';

/** Провайдер контексту правил — ін'єктується у сервіс. */
export interface RulesServicePort {
  /** Оцінити правило типу над контекстом */
  evaluateRule(type: RuleType, context: RuleContext): RuleResult;
  /** Отримати активні правила типу */
  getActiveRules(type: RuleType): RuleDefinition[];
  /** Завантажити правила за замовчуванням (для тестів) */
  seedDefaults(): void;
  /** Оновити規則 у registry */
  updateRule(ruleId: string, overrides: Partial<RuleDefinition>): RuleDefinition | undefined;
}

/** Сервіс правил T-4556 — core business rule engine integration. */
@Injectable()
export class RulesService implements RulesServicePort, OnModuleInit {
  private readonly engine: RuleEnginePort;
  private readonly contextProvider: RuleContextProvider;

  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repository: AttendanceRepository,
    @Inject(ATTENDANCE_CLOCK)
    private readonly clock: AttendanceClock
  ) {
    this.contextProvider = new DefaultRuleContextProvider(repository, () => this.clock.now());
    this.engine = new LightweightRuleEngine();
  }

  /** On module init - seed default rules. */
  onModuleInit(): void {
    this.engine.seedDefaults();
  }

  /** Оцінити правило типу над контекстом. */
  evaluateRule(type: RuleType, contextOverride?: Partial<RuleContext>): RuleResult {
    // Build context from repository + overrides
    const baseContext = this.contextProvider.buildContext(
      contextOverride?.appointmentId || '',
      contextOverride?.clientId || ''
    );

    // Merge with any overrides
    const mergedContext: RuleContext = {
      ...baseContext,
      ...contextOverride,
    };

    return this.engine.evaluate(type, mergedContext);
  }

  /** Отримати активні правила типу. */
  getActiveRules(type: RuleType): RuleDefinition[] {
    return this.engine.getActiveRules(type);
  }

  /** Завантажити правила за замовчуванням (для тестів / розробки). */
  seedDefaults(): void {
    this.engine.seedDefaults();
  }

  /** Оновити규則 у registry */
  updateRule(_ruleId: string, _overrides: Partial<RuleDefinition>): RuleDefinition | undefined {
    return this.engine.getActiveRules('booking').length > 0
      ? this.engine.getActiveRules('booking')[0] // placeholder
      : undefined;
  }
}
