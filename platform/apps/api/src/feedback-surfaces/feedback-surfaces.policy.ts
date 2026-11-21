/* eslint-disable max-lines -- cohesive module (110 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/**
 * T-151: чиста політика поверхонь відгуків (без Prisma, без Nest).
 *
 * Правила первого релізу (FDB-001..006):
 *  - вікно 30 днів після візиту, після його завершення — тільки перегляд;
 *  - одна відповідь на вікно, один редакторський правопис поки вікно відкрите (FDB-002);
 *  - оцінка обовʼязкова 1..5, текст ≤ 1000 символів, ≤ 3 фото;
 *  - нагадування одне, не раніше ніж через 2 години (FDB-MOB-02);
 *  - відгуки приватні, публікація — фаза 25 (FDB-006).
 */

export const FEEDBACK_WINDOW_DAYS = 30;
export const MAX_FEEDBACK_TEXT_LENGTH = 1000;
export const MAX_FEEDBACK_PHOTOS = 3;
export const REMINDER_DELAY_MS = 2 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export type FeedbackWindowState = 'open' | 'submitted' | 'expired' | 'closed';

export interface FeedbackWindowSnapshot {
  /** Статус з бази: open / submitted / expired / closed. */
  status: string;
  openedAt?: Date;
  windowEndsAt: Date;
  hasSubmission: boolean;
  reminderSent?: boolean;
}

export interface SubmissionDecision {
  canSubmit: boolean;
  canEdit: boolean;
  reason: string;
  windowStatus: string;
  daysRemaining: number;
}

/** Скільки днів лишилось у вікні (0, якщо вже минуло). */
export function daysRemainingUntil(windowEndsAt: Date, now: Date = new Date()): number {
  const remaining = windowEndsAt.getTime() - now.getTime();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / DAY_MS);
}

/**
 * Чи може клієнт подати (або востаннє відредагувати) відгук.
 * Дата завершення вікна переважає збережений статус: якщо час вийшов —
 * вікно вважається простроченим, навіть якщо джоба ще не оновила рядок.
 */
export function evaluateSubmission(
  snapshot: FeedbackWindowSnapshot,
  now: Date = new Date()
): SubmissionDecision {
  const daysRemaining = daysRemainingUntil(snapshot.windowEndsAt, now);
  const withinWindow = snapshot.windowEndsAt.getTime() >= now.getTime();

  if (snapshot.status === 'closed') {
    return {
      canSubmit: false,
      canEdit: false,
      reason: 'Feedback window is closed',
      windowStatus: 'closed',
      daysRemaining,
    };
  }

  if (!withinWindow) {
    return {
      canSubmit: false,
      canEdit: false,
      reason: 'Feedback window has expired',
      windowStatus: 'expired',
      daysRemaining: 0,
    };
  }

  if (snapshot.hasSubmission) {
    return {
      canSubmit: false,
      canEdit: true,
      reason: 'Feedback already submitted; one edit is allowed until the window closes',
      windowStatus: 'submitted',
      daysRemaining,
    };
  }

  if (snapshot.status !== 'open') {
    return {
      canSubmit: false,
      canEdit: false,
      reason: `Feedback window is ${snapshot.status}`,
      windowStatus: snapshot.status,
      daysRemaining,
    };
  }

  return {
    canSubmit: true,
    canEdit: false,
    reason: 'Within feedback window',
    windowStatus: 'open',
    daysRemaining,
  };
}

export interface FeedbackDraft {
  rating: number;
  text: string;
  photoCount?: number;
}

/** Помилки валідації чернетки; порожній масив — чернетку можна зберігати. */
export function validateFeedbackSubmission(draft: FeedbackDraft): string[] {
  const errors: string[] = [];
  const { rating, text, photoCount = 0 } = draft;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5 stars');
  }
  if (typeof text !== 'string' || text.length > MAX_FEEDBACK_TEXT_LENGTH) {
    errors.push(`Text must be ≤ ${MAX_FEEDBACK_TEXT_LENGTH} characters`);
  }
  if (photoCount > MAX_FEEDBACK_PHOTOS) {
    errors.push(`Maximum ${MAX_FEEDBACK_PHOTOS} photos allowed`);
  }

  return errors;
}

/** Середня оцінка з одним знаком після коми; 0 для порожнього списку. */
export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/** Чи настав момент єдиного нагадування (FDB-MOB-02). */
export function isReminderDue(snapshot: FeedbackWindowSnapshot, now: Date = new Date()): boolean {
  if (snapshot.reminderSent) return false;
  if (snapshot.hasSubmission) return false;
  if (snapshot.status !== 'open') return false;
  if (!snapshot.openedAt) return false;
  if (now.getTime() > snapshot.windowEndsAt.getTime()) return false;
  return now.getTime() - snapshot.openedAt.getTime() >= REMINDER_DELAY_MS;
}

/** Дата завершення вікна для візиту, завершеного в `completedAt`. */
export function windowEndsAt(completedAt: Date): Date {
  return new Date(completedAt.getTime() + FEEDBACK_WINDOW_DAYS * DAY_MS);
}
