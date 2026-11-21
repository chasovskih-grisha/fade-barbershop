/* eslint-disable max-lines -- cohesive module (134 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Тексти SMS поза підтвердженням і нагадуванням (T-080, WTL, NSH-007):
// чистий рендер даних у рядок, без HTML (канал його не несе), час — Europe/Kyiv.
// Правило NSH-007: повідомлення про no-show нейтральне — жодних штрафів,
// утримань чи докорів у тексті.
import { formatWhen } from './letter-fields';
import { SMS_LENGTH_LIMIT } from './appointment-reminder-sms';

export interface WaitlistPositionSmsData {
  position: number;
  barberName?: string;
  serviceName?: string;
  locationName?: string;
}

export interface WaitlistOfferSmsData {
  /** ISO-момент початку запропонованого слота. */
  start: string;
  /** Коли спливає право прийняти пропозицію. */
  expiresAt: Date;
  barberName?: string;
  locationName?: string;
}

export interface NoShowSmsData {
  /** ISO-момент пропущеного візиту. */
  start?: string;
  locationName?: string;
}

/** Час доби (HH:MM) у Europe/Kyiv для дедлайну акцепту. */
function deadlineTime(at: Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Kyiv',
  }).format(at);
}

/** Обрізати текст до одного SMS-повідомлення (ліміт каналу). */
export function clampToSmsLimit(text: string): string {
  return text.length <= SMS_LENGTH_LIMIT ? text : `${text.slice(0, SMS_LENGTH_LIMIT - 1)}…`;
}

/** Позиція в черзі: клієнт бачить номер і кого/де чекає. */
export function renderWaitlistPositionSms(data: WaitlistPositionSmsData): string {
  const parts = [`FADE: ви в черзі #${Math.max(1, Math.round(data.position))}`];
  if (data.serviceName) parts.push(data.serviceName);
  if (data.barberName) parts.push(`барбер: ${data.barberName}`);
  if (data.locationName) parts.push(data.locationName);
  parts.push('Ми напишемо, щойно зʼявиться слот.');
  return clampToSmsLimit(parts.join('\n'));
}

/** Пропозиція слота з тайм-аутом акцепту (WTL-003/005). */
export function renderWaitlistOfferSms(data: WaitlistOfferSmsData): string {
  const parts = ['FADE: є вільний слот'];
  const when = formatWhen(data.start);
  if (when) parts.push(when);
  if (data.barberName) parts.push(`барбер: ${data.barberName}`);
  if (data.locationName) parts.push(data.locationName);
  parts.push(`Підтвердіть до ${deadlineTime(data.expiresAt)}, інакше слот перейде наступному.`);
  return clampToSmsLimit(parts.join('\n'));
}

/** Пропозицію не прийняли вчасно — черга не карає, а пропонує далі. */
export function renderWaitlistOfferExpiredSms(): string {
  return 'FADE: час на підтвердження слота минув. Ми запропонуємо вам наступний.';
}

/** NSH-007: нейтральний текст без штрафних формулювань. */
export function renderNoShowSms(data: NoShowSmsData): string {
  const when = formatWhen(data.start);
  const parts = [when ? `FADE: вас не було на записі ${when}.` : 'FADE: вас не було на записі.'];
  if (data.locationName) parts.push(data.locationName);
  parts.push('Будемо раді бачити вас знову — оберіть новий час у застосунку.');
  return clampToSmsLimit(parts.join('\n'));
}

/** Підтвердження opt-in маркетингових SMS (STOP — вихід). */
export function renderMarketingOptInSms(): string {
  return 'FADE: ви підписалися на маркетингові SMS. Щоб відписатися, надішліть STOP.';
}

/** Підтвердження opt-out: без докорів, лише факт. */
export function renderMarketingOptOutSms(): string {
  return 'FADE: ви відписалися від маркетингових SMS. Нагадування про візити надходитимуть далі.';
}

// ─── T-4462: події лояльності ──────────────────────────────────────────────

export interface LoyaltyPointsSmsData {
  points: number;
  newBalance: number;
}

export interface LoyaltyTierSmsData {
  tier: string;
  discountPercent: number;
}

export interface LoyaltyExpiringSmsData {
  points: number;
  expiresAt: Date;
}

/** Нараховані бали після візиту (LYL). */
export function renderLoyaltyPointsEarnedSms(data: LoyaltyPointsSmsData): string {
  return clampToSmsLimit(`FADE: +${data.points} балів за візит. Баланс: ${data.newBalance}.`);
}

/** Досягнуто нового рівня. */
export function renderLoyaltyTierReachedSms(data: LoyaltyTierSmsData): string {
  return clampToSmsLimit(`FADE: новий рівень — ${data.tier}, знижка ${data.discountPercent}%.`);
}

/** Використані бали. */
export function renderLoyaltyPointsSpentSms(data: LoyaltyPointsSmsData): string {
  return clampToSmsLimit(`FADE: списано ${data.points} балів. Залишок: ${data.newBalance}.`);
}

/** Попередження за 7 днів до згорання балів. */
export function renderLoyaltyPointsExpiringSms(data: LoyaltyExpiringSmsData): string {
  const date = new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(data.expiresAt);
  return clampToSmsLimit(
    `FADE: ${data.points} балів згорять ${date}. Використайте їх на наступному візиті.`
  );
}

/** Один дайджест замість трьох пушів на день. */
export function renderLoyaltyDigestSms(lines: string[]): string {
  return clampToSmsLimit(['FADE: оновлення лояльності', ...lines].join('\n'));
}

/** Push-повідомлення про no-show (Europe/Kyiv час). */
export function renderNoShowPush(data: NoShowSmsData): string {
  const when = formatWhen(data.start);
  const parts = [when ? `FADE: вас не було на записі ${when}.` : 'FADE: вас не було на записі.'];
  if (data.locationName) parts.push(data.locationName);
  parts.push('Будемо раді бачити вас знову.');
  return parts.join(' ');
}

/** Email-повідомлення про нарахування балів лояльності. */
export function renderLoyaltyPointsEarnedEmail(data: {
  points: number;
  newBalance: number;
  tier?: string;
}): string {
  const tierInfo = data.tier ? `, новий рівень ${data.tier}` : '';
  return `FADE: +${data.points} балів за візит${tierInfo}. Залишок балансу: ${data.newBalance}.`;
}

/** Email-повідомлення про досягнення нового рівня лояльності. */
export function renderLoyaltyTierReachedEmail(data: {
  tier: string;
  discountPercent: number;
}): string {
  return `FADE: досягнут новий рівень — ${data.tier}, знижка ${data.discountPercent}%.`;
}

/** Email-повідомлення про використання балів. */
export function renderLoyaltyPointsSpentEmail(data: {
  points: number;
  newBalance: number;
}): string {
  return `FADE: списано ${data.points} балів. Залишок: ${data.newBalance}.`;
}

/** Email-повідомлення про згоряння балів. */
export function renderLoyaltyPointsExpiringEmail(data: {
  points: number;
  expiresAt: Date;
}): string {
  const date = new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(data.expiresAt);
  return `FADE: ${data.points} балів згорять ${date}. Використайте їх на наступному візиті.`;
}

/* EOF */
