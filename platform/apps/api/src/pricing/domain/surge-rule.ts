// Правила surge-ціноутворення (T-4811): множник заidone/днем тижня й
// рівнем барбера. Домен чистий: жодних БД і годинників — правило матчиться
// проти контексту запису, тому «чому ця ціна» перевіряється тестом.
//
// Множник — у базиснихpunkтах (12500 = ×1.25), як і решта грошової
// математики без float (DSC-004).

export type SeniorityTier = 'junior' | 'middle' | 'senior' | 'top';

export interface SurgeRule {
  id: string;
  /** null — правило мережі (будь-яка локація). */
  locationId: string | null;
  /** 0 = понеділок … 6 = неділя; null — будь-який день. */
  dayOfWeek: number | null;
  /** Вікно в хвилинах від початку доби (локальний час локації); null — весь день. */
  fromMinute: number | null;
  toMinute: number | null;
  /** null — будь-який рівень. */
  seniorityTier: SeniorityTier | null;
  /** ≥ 10000 (ніколи не знижуємо базову ціну surge-правилом). */
  multiplierBp: number;
  active: boolean;
}

export interface SurgeContext {
  locationId: string;
  start: Date;
  /** UTC-день тижня береться зі start; 0 = понеділок. */
  seniorityTier?: SeniorityTier | null;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function dayOfWeekUtc(start: Date): number {
  return (start.getUTCDay() + 6) % 7;
}

export function minuteOfDayUtc(start: Date): number {
  return Math.floor((start.getTime() % DAY_MS) / MINUTE_MS);
}

/** Специфічність правила: локація > рівень > день > вікно. */
export function ruleSpecificity(rule: SurgeRule): number {
  return (
    (rule.locationId ? 8 : 0) +
    (rule.seniorityTier ? 4 : 0) +
    (rule.dayOfWeek !== null ? 2 : 0) +
    (rule.fromMinute !== null && rule.toMinute !== null ? 1 : 0)
  );
}

/**
 * Найрелевантніще правило для контексту: спершу специфічніше, далі вищий
 * множник. null — surge не застосовується.
 */
export function matchSurgeRule(
  rules: readonly SurgeRule[],
  ctx: SurgeContext
): SurgeRule | null {
  const minute = minuteOfDayUtc(ctx.start);
  const candidates = rules.filter((rule) => ruleMatches(rule, minute, ctx));
  if (candidates.length === 0) return null;
  return candidates.sort(
    (a, b) => ruleSpecificity(b) - ruleSpecificity(a) || b.multiplierBp - a.multiplierBp
  )[0];
}

/** Перевірка, чи підходіть правила для контексту (у рамках одного виклику). */
function ruleMatches(rule: SurgeRule, minute: number, ctx: SurgeContext): boolean {
  let matches = 0;
  const total = 5; // location, dayOfWeek, seniorityTier, window-active, window-within
  if (rule.active) matches++;
  else return false;
  if (rule.locationId == null || rule.locationId === ctx.locationId) matches++;
  else return false;
  const day = dayOfWeekUtc(ctx.start);
  if (rule.dayOfWeek == null || rule.dayOfWeek === day) matches++;
  else return false;
  if (rule.seniorityTier == null || rule.seniorityTier === ctx.seniorityTier) matches++;
  else return false;
  if (rule.fromMinute == null || rule.toMinute == null || !(minute < rule.fromMinute || minute >= rule.toMinute)) matches++;
  else return false;
  return matches === total;
}

/** Ціна з множником, округлена до копійки; множник < 10000 ігнорується. */
export function applySurge(basePrice: number, multiplierBp: number): number {
  const base = Number.isFinite(basePrice) ? Math.max(0, Math.round(basePrice)) : 0;
  const bp = Number.isFinite(multiplierBp) ? Math.max(10_000, Math.round(multiplierBp)) : 10_000;
  return Math.round((base * bp) / 10_000);
}