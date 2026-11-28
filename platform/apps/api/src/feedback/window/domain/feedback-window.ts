// Вікно відгуку на завершений візит (T-150, ADR 0016). Правила тут, без Nest і
// Prisma: 30 днів на відгук, один відгук на візит (редагування дозволене, поки
// вікно відкрите), нагадування через 2 години — рівно одне.
export const WINDOW_DAYS = 30;
export const REMINDER_AFTER_MS = 2 * 60 * 60 * 1000;
export const MAX_TEXT_LENGTH = 1000;
export const MAX_PHOTOS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type FeedbackWindowStatus = 'open' | 'submitted' | 'expired' | 'closed';

export type FeedbackWindowView = {
  id: string;
  appointmentId: string;
  clientId: string;
  completedAt: string;
  windowEndsAt: string;
  status: FeedbackWindowStatus;
  remindedAt: string | null;
  submittedAt: string | null;
  rating: number | null;
  text: string | null;
  photos: string[];
  daysRemaining: number;
};

export type FeedbackWindowRecord = {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  locationId: string | null;
  completedAt: Date;
  windowEndsAt: Date;
  status: FeedbackWindowStatus;
  remindedAt: Date | null;
  submittedAt: Date | null;
  rating: number | null;
  text: string | null;
  photos: unknown;
};

export const windowEndsAtFor = (completedAt: Date, days = WINDOW_DAYS): Date =>
  new Date(completedAt.getTime() + days * DAY_MS);

export const daysRemaining = (windowEndsAt: Date, now = new Date()): number =>
  Math.max(0, Math.ceil((windowEndsAt.getTime() - now.getTime()) / DAY_MS));

/** Публічне подання після дедлайну — `expired`, без окремого крон-джоби. */
export const effectiveStatus = (
  record: FeedbackWindowRecord,
  now = new Date()
): FeedbackWindowStatus =>
  record.status === 'open' && now > record.windowEndsAt ? 'expired' : record.status;

export const reminderIsDue = (record: FeedbackWindowRecord, now = new Date()): boolean =>
  effectiveStatus(record, now) === 'open' &&
  record.remindedAt === null &&
  now.getTime() >= record.completedAt.getTime() + REMINDER_AFTER_MS;

/** Скільки секунд лишилось до 2-годинної позначки; для планувальника push. */
export const reminderDueAt = (completedAt: Date): Date =>
  new Date(completedAt.getTime() + REMINDER_AFTER_MS);

export class FeedbackWindowNotFound extends Error {
  constructor() {
    super('Feedback window not found');
  }
}

/** Не власник вікна — HTTP 403. */
export class NotTheWindowOwner extends Error {
  constructor() {
    super('Only the visit client can use this feedback window');
  }
}

/** Вікно вже не приймає відгук (expired/closed) — HTTP 409. */
export class FeedbackWindowClosed extends Error {
  constructor(readonly status: FeedbackWindowStatus) {
    super(`Feedback window is ${status}`);
  }
}

/** Некоректний відгук — HTTP 400. */
export class InvalidFeedback extends Error {
  constructor(readonly reason: 'rating' | 'text' | 'photos') {
    super(
      reason === 'rating'
        ? 'Rating must be between 1 and 5'
        : reason === 'text'
          ? `Text must be at most ${MAX_TEXT_LENGTH} characters`
          : `At most ${MAX_PHOTOS} photos allowed`
    );
  }
}
