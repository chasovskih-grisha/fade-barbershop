// Автоматичні правила знижок (T-152, DSC-RULE-01…03): «перший візит» і
// «непікові години». Між собою вони не комбінуються — калькулятор бере
// найвигідніше з переданих джерел (DSC-003). Правило вимкнене — не діє
// на нові записи, створені візити не перераховуються (DSC-001).
import type { DiscountSource } from './discount-calculator';
import { discountSourceFor, type DiscountValue } from './promo-code';

export type DiscountRuleKind = 'first_visit' | 'off_peak';

/** Вікно непікових годин: дні ISO (1 = Пн … 7 = Нд) і межі в хвилинах від 00:00. */
export interface OffPeakWindow {
  weekdays: number[];
  /** Включно. */
  startMinute: number;
  /** Не включно; `endMinute < startMinute` — вікно через північ. */
  endMinute: number;
}

export interface DiscountRule {
  id: string;
  kind: DiscountRuleKind;
  value: DiscountValue;
  active: boolean;
  /** Обовʼязкове для `off_peak`. */
  offPeak?: OffPeakWindow;
}

export interface RuleContext {
  /** DSC-RULE-01: клієнт без жодного завершеного візиту. */
  hasCompletedVisit: boolean;
  /** Обраний слот. */
  slotStart: Date;
  /** Часовий пояс точки (IANA); дефолт — локальний пояс процесу. */
  timeZone?: string;
}

/** Дефолтні значення з AC: «перший візит» — 10%. */
export const DEFAULT_FIRST_VISIT_PERCENT = 10;
export const DEFAULT_OFF_PEAK_PERCENT = 10;

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** День тижня і хвилина доби слота в поясі точки. */
export function localSlotTime(
  date: Date,
  timeZone?: string
): { weekday: number; minuteOfDay: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = WEEKDAY_INDEX[lookup('weekday')] ?? 1;
  const hour = Number(lookup('hour')) % 24;
  const minute = Number(lookup('minute'));

  return { weekday, minuteOfDay: hour * 60 + minute };
}

/** Чи потрапляє слот у вікно непікових годин (DSC-RULE-02). */
export function isOffPeakWindow(
  slotStart: Date,
  window: OffPeakWindow,
  timeZone?: string
): boolean {
  const { weekday, minuteOfDay } = localSlotTime(slotStart, timeZone);
  if (!window.weekdays.includes(weekday)) return false;

  const { startMinute, endMinute } = window;
  if (startMinute <= endMinute) {
    return minuteOfDay >= startMinute && minuteOfDay < endMinute;
  }
  // Вікно через північ: [startMinute, 24:00) ∪ [00:00, endMinute).
  return minuteOfDay >= startMinute || minuteOfDay < endMinute;
}

/** Чи правило застосовне до цього запису. */
export function ruleApplies(rule: DiscountRule, context: RuleContext): boolean {
  if (!rule.active) return false;

  if (rule.kind === 'first_visit') return !context.hasCompletedVisit;

  if (rule.kind === 'off_peak') {
    if (!rule.offPeak) return false;
    return isOffPeakWindow(context.slotStart, rule.offPeak, context.timeZone);
  }

  return false;
}

/** Джерела знижок активних правил для калькулятора (він обере найвигідніше). */
export function applicableRuleSources(
  rules: DiscountRule[],
  context: RuleContext
): DiscountSource[] {
  return rules
    .filter((rule) => ruleApplies(rule, context))
    .map((rule) => discountSourceFor(rule.id, 'rule', rule.value));
}
