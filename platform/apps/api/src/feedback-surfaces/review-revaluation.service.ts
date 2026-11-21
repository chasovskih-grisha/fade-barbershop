/* eslint-disable max-lines -- cohesive module (122 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4463: сервіс закритого циклу відгуку. Правила — у review-revaluation.policy,
// тут лише порт сховища й послідовність кроків.
//
// Сховище in-memory: у `prisma/schema.prisma` немає моделей відгуків, тож
// durable-таблиця з'явиться разом із persistence-слайсом зворотного зв'язку.
// Порт `ReviewRevaluationRepository` готовий прийняти Prisma-адаптер.
import { Inject, Injectable } from '@nestjs/common';
import {
  applyClientRating,
  closeLoop,
  moderateShowcase,
  openRevaluation,
  publicShowcaseEligibility,
  revaluationSummary,
  recordAdminReply,
  type RevaluationPromptDecision,
  type ReviewRevaluation,
  type ShowcaseState,
} from './review-revaluation.policy';

export const REVIEW_REVALUATION_REPOSITORY = 'REVIEW_REVALUATION_REPOSITORY';

export interface ReviewRevaluationRepository {
  find(reviewId: string): Promise<ReviewRevaluation | null>;
  save(state: ReviewRevaluation): Promise<void>;
  list(): Promise<ReviewRevaluation[]>;
}

export class InMemoryReviewRevaluationRepository implements ReviewRevaluationRepository {
  private readonly states = new Map<string, ReviewRevaluation>();

  async find(reviewId: string): Promise<ReviewRevaluation | null> {
    return this.states.get(reviewId) ?? null;
  }

  async save(state: ReviewRevaluation): Promise<void> {
    this.states.set(state.reviewId, state);
  }

  async list(): Promise<ReviewRevaluation[]> {
    return [...this.states.values()];
  }
}

export interface PublicShowcaseReview {
  reviewId: string;
  rating: number;
  text: string;
}

@Injectable()
export class ReviewRevaluationService {
  constructor(
    @Inject(REVIEW_REVALUATION_REPOSITORY)
    private readonly repository: ReviewRevaluationRepository
  ) {}

  /** Перша реєстрація відгуку в циклі (або читання наявного стану). */
  async track(input: {
    reviewId: string;
    rating: number;
    text: string;
    at?: Date;
  }): Promise<ReviewRevaluation> {
    const existing = await this.repository.find(input.reviewId);
    if (existing) return existing;
    const state = openRevaluation(input);
    await this.repository.save(state);
    return state;
  }

  /**
   * Клієнт змінює оцінку. Відгук, якого ще немає в циклі, реєструється
   * автоматично з цією ж оцінкою як початковою.
   */
  async rate(
    reviewId: string,
    input: { rating: number; text: string; at?: Date }
  ): Promise<ReviewRevaluation> {
    const existing = await this.repository.find(reviewId);
    const state = existing ?? openRevaluation({ reviewId, ...input });
    if (!existing) {
      await this.repository.save(state);
      return state;
    }
    const updated = applyClientRating(state, input);
    await this.repository.save(updated);
    return updated;
  }

  /** Відповідь адміна: активує повторний запит оцінки за правилом політики. */
  async onAdminReply(
    reviewId: string,
    at: Date = new Date()
  ): Promise<{ state: ReviewRevaluation; decision: RevaluationPromptDecision }> {
    const state = await this.requireState(reviewId);
    const result = recordAdminReply(state, at);
    if (result.state !== state) await this.repository.save(result.state);
    return result;
  }

  /** Закриття циклу: оцінка більше не редагується. */
  async close(reviewId: string, actorId: string, at?: Date): Promise<ReviewRevaluation> {
    const state = await this.requireState(reviewId);
    const updated = closeLoop(state, actorId, at);
    await this.repository.save(updated);
    return updated;
  }

  /** Модерація запису для публічної вітрини. */
  async moderate(
    reviewId: string,
    input: {
      moderatorId: string;
      decision: 'approved' | 'rejected';
      note?: string;
      at?: Date;
    }
  ): Promise<ReviewRevaluation> {
    const state = await this.requireState(reviewId);
    const updated = moderateShowcase(state, input);
    await this.repository.save(updated);
    return updated;
  }

  /** Публічна проєкція: лише схвалені модерацією 4–5★ записи. */
  async showcase(): Promise<PublicShowcaseReview[]> {
    const states = await this.repository.list();
    return states
      .filter((state) => publicShowcaseEligibility(state).eligible)
      .sort((a, b) => b.currentRating - a.currentRating)
      .map((state) => ({
        reviewId: state.reviewId,
        rating: state.currentRating,
        text: state.text,
      }));
  }

  async summary(reviewId: string): Promise<
    ReturnType<typeof revaluationSummary> & {
      showcaseState: ShowcaseState;
    }
  > {
    const state = await this.requireState(reviewId);
    return { ...revaluationSummary(state), showcaseState: state.showcase };
  }

  private async requireState(reviewId: string): Promise<ReviewRevaluation> {
    const state = await this.repository.find(reviewId);
    if (!state) throw new Error(`Review ${reviewId} is not tracked for revaluation`);
    return state;
  }
}
