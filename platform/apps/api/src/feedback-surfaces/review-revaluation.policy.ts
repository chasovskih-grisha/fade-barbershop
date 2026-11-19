/**
 * T-4463: закритий цикл відгуку — чиста політика (без Nest, без Prisma).
 *
 * Що робимо після надісланого відгуку:
 *  1. клієнт може **покращити/змінити** оцінку, поки цикл не закрито;
 *  2. відповідь адміна (T-4451) активує **повторний запит** оцінки, але лише
 *     для низької оцінки й лише один раз на ту саму оцінку — «не питаємо
 *     двічі поспіль низьку» (ризик спаму й вигоряння клієнта);
 *  3. стан «закрито» фіксує, що цикл завершено (після цього оцінка не
 *     редагується);
 *  4. запис на публічну вітрину (T-240) показується **лише після модерації**:
 *     4–5★, достатній текст, явне схвалення оператора.
 *
 * Сховище станів — in-memory (порт `ReviewRevaluationRepository`), бо в
 * `prisma/schema.prisma` досі немає моделей відгуків. Домен від цього не
 * залежить: усі правила тут, без побічних ефектів.
 */

export const LOW_RATING_MAX = 3;
export const SHOWCASE_MIN_RATING = 4;
export const SHOWCASE_MIN_TEXT_LENGTH = 20;
export const MAX_REVIEW_TEXT_LENGTH = 1000;

export type RatingSource = 'initial' | 'client' | 'admin';

export interface RatingEntry {
  at: Date;
  rating: number;
  source: RatingSource;
}

export type ShowcaseState = 'not_requested' | 'pending' | 'approved' | 'rejected';

/** Стан закритого циклу одного відгуку. */
export interface ReviewRevaluation {
  reviewId: string;
  /** Перша оцінка клієнта — для звіту «було/стало». */
  originalRating: number;
  currentRating: number;
  text: string;
  history: RatingEntry[];
  /** Запити повторної оцінки, які вже надіслали клієнту. */
  prompts: Array<{ at: Date; rating: number }>;
  closedAt?: Date;
  closedBy?: string;
  showcase: ShowcaseState;
  moderatedBy?: string;
  moderatedAt?: Date;
  moderationNote?: string;
}

export interface ClientRatingInput {
  rating: number;
  text: string;
  at?: Date;
}

export interface ShowcaseModerationInput {
  moderatorId: string;
  decision: 'approved' | 'rejected';
  note?: string;
  at?: Date;
}

export interface RevaluationPromptDecision {
  ask: boolean;
  reason: string;
}

export function isLowRating(rating: number): boolean {
  return rating <= LOW_RATING_MAX;
}

/** Помилки вводу оцінки; порожній масив — ввід приймається. */
export function validateRatingInput(rating: number, text: string): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer from 1 to 5');
  }
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) errors.push('Review text is required');
  if (trimmed.length > MAX_REVIEW_TEXT_LENGTH) {
    errors.push(`Review text must be ≤ ${MAX_REVIEW_TEXT_LENGTH} characters`);
  }
  return errors;
}

/** Текст придатний для публічної вітрини (без «ок»/«5»). */
export function isShowcaseQualityText(text: string): boolean {
  return typeof text === 'string' && text.trim().length >= SHOWCASE_MIN_TEXT_LENGTH;
}

/** Починаємо відстежувати цикл відгуку з першою оцінкою. */
export function openRevaluation(input: {
  reviewId: string;
  rating: number;
  text: string;
  at?: Date;
}): ReviewRevaluation {
  const errors = validateRatingInput(input.rating, input.text);
  if (errors.length > 0) throw new Error(errors.join('; '));

  const at = input.at ?? new Date();
  return {
    reviewId: input.reviewId,
    originalRating: input.rating,
    currentRating: input.rating,
    text: input.text.trim(),
    history: [{ at, rating: input.rating, source: 'initial' }],
    prompts: [],
    showcase: input.rating >= SHOWCASE_MIN_RATING ? 'pending' : 'not_requested',
  };
}

/** Чи можна ще редагувати оцінку. */
export function canEditRating(state: ReviewRevaluation): { allowed: boolean; reason: string } {
  if (state.closedAt) {
    return { allowed: false, reason: 'Review loop is closed; rating can no longer be edited' };
  }
  return { allowed: true, reason: '' };
}

/**
 * Покращення/зміна оцінки клієнтом.
 *
 * - закритий цикл оцінку не приймає;
 * - будь-яка нова оцінка переводить вітрину в `pending` (текст міг змінитися,
 *   а «п’ятірка» без перевірки — це фрод-ризик);
 * - повернення до низької оцінки знімає вітрину й очищає модерацію.
 */
export function applyClientRating(
  state: ReviewRevaluation,
  input: ClientRatingInput
): ReviewRevaluation {
  const errors = validateRatingInput(input.rating, input.text);
  if (errors.length > 0) throw new Error(errors.join('; '));

  const gate = canEditRating(state);
  if (!gate.allowed) throw new Error(gate.reason);

  const at = input.at ?? new Date();
  const showcase: ShowcaseState =
    input.rating >= SHOWCASE_MIN_RATING ? 'pending' : 'not_requested';

  const updated: ReviewRevaluation = {
    ...state,
    currentRating: input.rating,
    text: input.text.trim(),
    history: [...state.history, { at, rating: input.rating, source: 'client' }],
    showcase,
  };
  delete updated.moderatedBy;
  delete updated.moderatedAt;
  delete updated.moderationNote;
  return updated;
}

/**
 * Чи питати клієнта вдруге після відповіді адміна.
 *
 * Правило «не питаємо двічі поспіль низьку»: якщо на цю саму низьку оцінку
 * запит уже надіслали й клієнт її не покращив — мовчимо. Новий запит
 * з’являється лише після відповіді адміна й лише для низької оцінки.
 */
export function shouldAskForRevaluation(
  state: ReviewRevaluation
): RevaluationPromptDecision {
  if (state.closedAt) return { ask: false, reason: 'Review loop is closed' };
  if (!isLowRating(state.currentRating)) {
    return { ask: false, reason: 'Rating is already high; no re-rating needed' };
  }

  const promptForRating = [...state.prompts]
    .reverse()
    .find((prompt) => prompt.rating === state.currentRating);

  if (!promptForRating) {
    return { ask: true, reason: 'Low rating after admin reply: ask for an improved rating' };
  }

  const improvedSincePrompt = state.history.some(
    (entry) => entry.at.getTime() > promptForRating.at.getTime() && entry.rating > promptForRating.rating
  );
  if (improvedSincePrompt) {
    return { ask: true, reason: 'Client improved the rating: ask once more for a final score' };
  }

  return {
    ask: false,
    reason: 'Already asked for this rating; not asking twice in a row',
  };
}

/**
 * Відповідь адміна фіксується в циклі: якщо запит повторної оцінки доречний —
 * він надсилається один раз і позначається, щоб не повторювати його далі.
 */
export function recordAdminReply(
  state: ReviewRevaluation,
  at: Date = new Date()
): { state: ReviewRevaluation; decision: RevaluationPromptDecision } {
  const decision = shouldAskForRevaluation(state);
  if (!decision.ask) return { state, decision };

  return {
    state: {
      ...state,
      prompts: [...state.prompts, { at, rating: state.currentRating }],
    },
    decision,
  };
}

/** Завершення циклу: після цього оцінка не редагується. */
export function closeLoop(
  state: ReviewRevaluation,
  actorId: string,
  at: Date = new Date()
): ReviewRevaluation {
  if (state.closedAt) return state;
  return { ...state, closedAt: at, closedBy: actorId };
}

/** Модерація запису для публічної вітрини (ризик: фрод оцінок). */
export function moderateShowcase(
  state: ReviewRevaluation,
  input: ShowcaseModerationInput
): ReviewRevaluation {
  if (state.currentRating < SHOWCASE_MIN_RATING) {
    throw new Error('Only 4–5★ reviews can be shown publicly');
  }
  if (!isShowcaseQualityText(state.text)) {
    throw new Error(`Public review needs at least ${SHOWCASE_MIN_TEXT_LENGTH} characters`);
  }

  const at = input.at ?? new Date();
  const updated: ReviewRevaluation = {
    ...state,
    showcase: input.decision,
    moderatedBy: input.moderatorId,
    moderatedAt: at,
  };
  if (input.note) updated.moderationNote = input.note;
  else delete updated.moderationNote;
  return updated;
}

/** Чи показувати відгук на вітрині зараз (публічна проєкція T-240). */
export function publicShowcaseEligibility(
  state: ReviewRevaluation
): { eligible: boolean; reason: string } {
  if (state.currentRating < SHOWCASE_MIN_RATING) {
    return { eligible: false, reason: 'Rating is below the public threshold' };
  }
  if (state.showcase === 'approved') {
    return isShowcaseQualityText(state.text)
      ? { eligible: true, reason: 'Approved by moderation' }
      : { eligible: false, reason: 'Text does not meet the public quality bar' };
  }
  if (state.showcase === 'rejected') {
    return { eligible: false, reason: 'Rejected by moderation' };
  }
  return { eligible: false, reason: 'Awaiting moderation' };
}

/** Рядок для адмін-звіту «було → стало». */
export function revaluationSummary(state: ReviewRevaluation): {
  originalRating: number;
  currentRating: number;
  delta: number;
  promptsSent: number;
  closed: boolean;
  showcase: ShowcaseState;
} {
  return {
    originalRating: state.originalRating,
    currentRating: state.currentRating,
    delta: state.currentRating - state.originalRating,
    promptsSent: state.prompts.length,
    closed: Boolean(state.closedAt),
    showcase: state.showcase,
  };
}
