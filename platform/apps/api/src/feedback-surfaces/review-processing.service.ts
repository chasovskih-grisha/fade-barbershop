// T-4451: опрацювання відгуків — відповідь адміна, статуси, черга
// «неопрацьовані» й SLA. Рішення — у review-processing.policy (чистий домен),
// тут лише порт сховища і послідовність кроків.
//
// Сховище навмисно in-memory: у `prisma/schema.prisma` немає моделей відгуків
// (FeedbackWindow/FeedbackSubmission), тож durable-таблиця з'явиться разом із
// persistence-слайсом зворотного зв'язку. Порт `ReviewProcessingRepository`
// готовий прийняти Prisma-адаптер без зміни use-case.
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  applyReply,
  applyStatus,
  slaSummary,
  sortUnprocessed,
  type ReviewProcessingStatus,
  type ReviewReply,
  type ReviewWorkItem,
  type SlaSummary,
} from './review-processing.policy';

export const REVIEW_PROCESSING_REPOSITORY = 'REVIEW_PROCESSING_REPOSITORY';

export interface ReviewProcessingRepository {
  findById(reviewId: string): Promise<ReviewWorkItem | null>;
  save(review: ReviewWorkItem): Promise<void>;
  list(): Promise<ReviewWorkItem[]>;
}

/** Сховище в пам'яті: один екземпляр на процес, поки немає таблиць відгуків. */
export class InMemoryReviewProcessingRepository implements ReviewProcessingRepository {
  private readonly reviews = new Map<string, ReviewWorkItem>();

  async findById(reviewId: string): Promise<ReviewWorkItem | null> {
    return this.reviews.get(reviewId) ?? null;
  }

  async save(review: ReviewWorkItem): Promise<void> {
    this.reviews.set(review.id, review);
  }

  async list(): Promise<ReviewWorkItem[]> {
    return [...this.reviews.values()];
  }
}

@Injectable()
export class ReviewProcessingService {
  constructor(
    @Inject(REVIEW_PROCESSING_REPOSITORY)
    private readonly repository: ReviewProcessingRepository
  ) {}

  /** Відгук потрапляє сюди зі слайсу подання (або бекфілу). */
  async register(review: ReviewWorkItem): Promise<ReviewWorkItem> {
    await this.repository.save(review);
    return review;
  }

  /** Публічна відповідь адміна; переводить `new → processed`. */
  async reply(
    reviewId: string,
    input: { adminId: string; text: string }
  ): Promise<{ review: ReviewWorkItem; reply: ReviewReply }> {
    const review = await this.requireReview(reviewId);
    const { review: updated, reply } = applyReply(review, input, uuidv7());
    await this.repository.save(updated);
    return { review: updated, reply };
  }

  /** Ручне перемикання статусу: новий / опрацьований / архів. */
  async setStatus(
    reviewId: string,
    status: ReviewProcessingStatus,
    actorId: string
  ): Promise<ReviewWorkItem> {
    const review = await this.requireReview(reviewId);
    const updated = applyStatus(review, status, actorId);
    await this.repository.save(updated);
    return updated;
  }

  /** Черга підтримки: «неопрацьовані», найстаріші спершу. */
  async listUnprocessed(limit?: number): Promise<ReviewWorkItem[]> {
    const reviews = await this.repository.list();
    return sortUnprocessed(reviews, limit);
  }

  /** Охоплення SLA для звіта (FDB-ADM-03). */
  async sla(now: Date = new Date()): Promise<SlaSummary> {
    const reviews = await this.repository.list();
    return slaSummary(reviews, now);
  }

  private async requireReview(reviewId: string): Promise<ReviewWorkItem> {
    const review = await this.repository.findById(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);
    return review;
  }
}
