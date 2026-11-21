/* eslint-disable max-lines, max-params -- cohesive module (153 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: applyStatus, limit 3); API redesign tracked in T-2500f */
/**
 * T-4451: чиста політика опрацювання відгуків (без Prisma, без Nest).
 *
 * Відгук проходить життєвий цикл підтримки: `new → processed → archived`.
 * Відповідь адміна публічна, тому:
 *  - порожня відповідь або довша за 500 символів — помилка валідації;
 *  - відповідь переводить відгук у `processed` (SLA-охоплення видно у звіті);
 *  - кожна наступна відповідь — **новий потік** (`respond → reply → respond`),
 *    бо відповідь клієнта на відповідь бізнесу не має губитися в старому треді;
 *  - архівований відгук відповідей не приймає: спершу треба зняти з архіву.
 *
 * SLA (FDB-ADM-03, «неопрацьовані»): за замовчуванням доба на першу відповідь.
 */

export type ReviewProcessingStatus = 'new' | 'processed' | 'archived';

export const REVIEW_SLA_HOURS = 24;
export const MAX_REVIEW_REPLY_LENGTH = 500;

/** Відповідь адміна в потоці відгуку. */
export interface ReviewReply {
  id: string;
  reviewId: string;
  /** Потік: `1` — перша відповідь, `2` — відповідь на відповідь клієнта тощо. */
  threadSeq: number;
  threadId: string;
  adminId: string;
  text: string;
  repliedAt: Date;
}

/** Відгук очима підтримки: прив'язка до візиту/клієнта + стан опрацювання. */
export interface ReviewWorkItem {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId?: string;
  rating: number;
  submittedAt: Date;
  status: ReviewProcessingStatus;
  processedAt?: Date;
  processedBy?: string;
  repliedAt?: Date;
  replies: ReviewReply[];
}

export interface ReviewReplyInput {
  adminId: string;
  text: string;
  at?: Date;
}

export type SlaState = 'ok' | 'due_soon' | 'breached' | 'done';

const HOUR_MS = 60 * 60 * 1000;
const DUE_SOON_HOURS = 6;

/** Помилки валідації відповіді; порожній масив — відповідь приймається. */
export function validateReply(text: string): string[] {
  const errors: string[] = [];
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) errors.push('Reply text is required');
  if (trimmed.length > MAX_REVIEW_REPLY_LENGTH) {
    errors.push(`Reply text must be ≤ ${MAX_REVIEW_REPLY_LENGTH} characters`);
  }
  return errors;
}

/** Чи приймає відгук відповідь зараз. */
export function canReply(review: ReviewWorkItem): { allowed: boolean; reason: string } {
  if (review.status === 'archived') {
    return { allowed: false, reason: 'Archived review cannot be replied to; restore it first' };
  }
  return { allowed: true, reason: '' };
}

export function nextThreadSeq(review: ReviewWorkItem): number {
  return review.replies.length + 1;
}

/**
 * Додає відповідь: валідація, заборона для архіву, новий потік на кожну
 * відповідь і перехід `new → processed`.
 */
export function applyReply(
  review: ReviewWorkItem,
  input: ReviewReplyInput,
  replyId: string
): { review: ReviewWorkItem; reply: ReviewReply } {
  const errors = validateReply(input.text);
  if (errors.length > 0) throw new Error(errors.join('; '));

  const gate = canReply(review);
  if (!gate.allowed) throw new Error(gate.reason);

  const at = input.at ?? new Date();
  const threadSeq = nextThreadSeq(review);
  const reply: ReviewReply = {
    id: replyId,
    reviewId: review.id,
    threadSeq,
    threadId: `${review.id}#${threadSeq}`,
    adminId: input.adminId,
    text: input.text.trim(),
    repliedAt: at,
  };

  const updated: ReviewWorkItem = {
    ...review,
    replies: [...review.replies, reply],
    repliedAt: review.repliedAt ?? at,
  };

  if (updated.status === 'new') {
    updated.status = 'processed';
    updated.processedAt = at;
    updated.processedBy = input.adminId;
  }

  return { review: updated, reply };
}

/** Ручна зміна статусу (новий / опрацьований / архів). */
export function applyStatus(
  review: ReviewWorkItem,
  status: ReviewProcessingStatus,
  actorId: string,
  at: Date = new Date()
): ReviewWorkItem {
  if (status === review.status) return review;

  const updated: ReviewWorkItem = { ...review, status };
  if (status === 'processed') {
    updated.processedAt = at;
    updated.processedBy = actorId;
  }
  if (status === 'new') {
    delete updated.processedAt;
    delete updated.processedBy;
  }
  return updated;
}

export function isUnprocessed(review: ReviewWorkItem): boolean {
  return review.status === 'new';
}

/** Стан SLA для відгуку: виконаний / у нормі / на межі / прострочений. */
export function slaState(
  review: ReviewWorkItem,
  now: Date = new Date(),
  slaHours: number = REVIEW_SLA_HOURS
): SlaState {
  if (review.status !== 'new') return 'done';
  const waitedHours = (now.getTime() - review.submittedAt.getTime()) / HOUR_MS;
  if (waitedHours > slaHours) return 'breached';
  if (waitedHours >= slaHours - DUE_SOON_HOURS) return 'due_soon';
  return 'ok';
}

export interface SlaSummary {
  unprocessed: number;
  breached: number;
  dueSoon: number;
  processed: number;
  archived: number;
  /** Хвилини, які чекає найстаріший неопрацьований відгук. */
  oldestUnprocessedMinutes: number;
  slaHours: number;
}

export function slaSummary(
  reviews: ReviewWorkItem[],
  now: Date = new Date(),
  slaHours: number = REVIEW_SLA_HOURS
): SlaSummary {
  const states = reviews.map((review) => ({ review, state: slaState(review, now, slaHours) }));
  const unprocessed = reviews.filter(isUnprocessed);

  return {
    unprocessed: unprocessed.length,
    breached: states.filter((entry) => entry.state === 'breached').length,
    dueSoon: states.filter((entry) => entry.state === 'due_soon').length,
    processed: reviews.filter((review) => review.status === 'processed').length,
    archived: reviews.filter((review) => review.status === 'archived').length,
    oldestUnprocessedMinutes: unprocessed.reduce((max, review) => {
      const waited = Math.max(
        0,
        Math.round((now.getTime() - review.submittedAt.getTime()) / 60_000)
      );
      return Math.max(max, waited);
    }, 0),
    slaHours,
  };
}

/** Черга підтримки: найстаріші спершу, ліміт застосовується після сортування. */
export function sortUnprocessed(reviews: ReviewWorkItem[], limit?: number): ReviewWorkItem[] {
  const sorted = reviews
    .filter(isUnprocessed)
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  return limit === undefined ? sorted : sorted.slice(0, Math.max(0, limit));
}
