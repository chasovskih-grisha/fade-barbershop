/** Custom workflow trigger, condition and action engine (T-5020). */
import { matchesCondition } from './workflow-conditions';

// Оцінка умови живе в workflow-conditions.ts (LOC/складність на функцію);
// публічний шлях модуля лишається тим самим для викликів і спеків.
export { matchesCondition };

export type WorkflowTrigger =
  | 'booking_created'
  | 'client_inactive'
  | 'review_received'
  | 'inventory_low';

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'includes'
  | 'exists';

export interface RuleCondition {
  /** Dot path into the event payload, e.g. `client.daysSinceVisit`. */
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value?: unknown;
}

export type WorkflowActionType = 'send_email' | 'send_sms' | 'award_points' | 'assign_task';

export interface RuleAction {
  readonly type: WorkflowActionType;
  readonly params: Readonly<Record<string, unknown>>;
}

export interface WorkflowRule {
  readonly id: string;
  readonly name: string;
  readonly trigger: WorkflowTrigger;
  readonly conditions: readonly RuleCondition[];
  readonly actions: readonly RuleAction[];
  readonly enabled: boolean;
}

export interface WorkflowEvent {
  readonly trigger: WorkflowTrigger;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface MatchedRule {
  readonly ruleId: string;
  readonly name: string;
  readonly actions: readonly RuleAction[];
}

export interface WorkflowRun {
  readonly matched: readonly MatchedRule[];
  readonly evaluated: number;
  readonly skippedDisabled: number;
}

const WORKFLOW_TRIGGERS: readonly WorkflowTrigger[] = [
  'booking_created',
  'client_inactive',
  'review_received',
  'inventory_low',
];

const WORKFLOW_ACTIONS: readonly WorkflowActionType[] = [
  'send_email',
  'send_sms',
  'award_points',
  'assign_task',
];

/** Returns validation errors; an empty list means the rule is executable. */
export function validateWorkflowRule(rule: WorkflowRule): string[] {
  const errors: string[] = [];
  if (!rule.id.trim()) errors.push('id_required');
  if (!rule.name.trim()) errors.push('name_required');
  if (!WORKFLOW_TRIGGERS.includes(rule.trigger)) errors.push('unknown_trigger');
  if (rule.actions.length === 0) errors.push('actions_required');
  for (const action of rule.actions) {
    if (!WORKFLOW_ACTIONS.includes(action.type)) errors.push(`unknown_action:${action.type}`);
  }
  for (const condition of rule.conditions) {
    if (!condition.field.trim()) errors.push('condition_field_required');
  }
  return errors;
}

/**
 * Runs every enabled rule for the event trigger. Conditions are ANDed; matching
 * actions are returned for the caller to execute, so the engine stays side-effect free.
 */
export function evaluateWorkflow(
  rules: readonly WorkflowRule[],
  event: WorkflowEvent
): WorkflowRun {
  const matched: MatchedRule[] = [];
  let evaluated = 0;
  let skippedDisabled = 0;

  for (const rule of rules) {
    if (!rule.enabled) {
      skippedDisabled += 1;
      continue;
    }
    if (rule.trigger !== event.trigger) continue;
    evaluated += 1;
    if (rule.conditions.every((condition) => matchesCondition(condition, event.data))) {
      matched.push({ ruleId: rule.id, name: rule.name, actions: rule.actions });
    }
  }
  return { matched, evaluated, skippedDisabled };
}
