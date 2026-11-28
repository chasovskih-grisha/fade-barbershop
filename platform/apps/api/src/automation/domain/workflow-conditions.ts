/** Оцінка однієї умови правила (T-5020): читання шляху в payload і таблиця
 * операторів. Винесено з рушія, щоб кожна гілка читалася окремо. */
import type { ConditionOperator, RuleCondition } from './workflow-rule-engine';

type RangeOperator = 'gt' | 'gte' | 'lt' | 'lte';

const COMPARATORS: Readonly<Record<RangeOperator, (left: number, right: number) => boolean>> = {
  gt: (left, right) => left > right,
  gte: (left, right) => left >= right,
  lt: (left, right) => left < right,
  lte: (left, right) => left <= right,
};

function isRangeOperator(operator: ConditionOperator): operator is RangeOperator {
  return operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte';
}

function readPath(data: Readonly<Record<string, unknown>>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, data);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** `includes` працює і для рядків, і для масивів; інші типи не збігаються. */
function includesValue(actual: unknown, expected: unknown): boolean {
  if (typeof actual === 'string') return actual.includes(String(expected));
  if (Array.isArray(actual)) return actual.includes(expected);
  return false;
}

/** Діапазонні оператори: нечислові значення з обох боків дають false, не помилку. */
function compareRange(actual: unknown, condition: RuleCondition): boolean {
  if (!isRangeOperator(condition.operator)) return false;
  const left = asNumber(actual);
  const right = asNumber(condition.value);
  if (left === null || right === null) return false;
  return COMPARATORS[condition.operator](left, right);
}

/** Evaluates one condition against the event payload. */
export function matchesCondition(
  condition: RuleCondition,
  data: Readonly<Record<string, unknown>>
): boolean {
  const actual = readPath(data, condition.field);
  if (condition.operator === 'exists') return actual !== undefined && actual !== null;
  if (condition.operator === 'eq') return actual === condition.value;
  if (condition.operator === 'neq') return actual !== condition.value;
  if (condition.operator === 'includes') return includesValue(actual, condition.value);
  return compareRange(actual, condition);
}
