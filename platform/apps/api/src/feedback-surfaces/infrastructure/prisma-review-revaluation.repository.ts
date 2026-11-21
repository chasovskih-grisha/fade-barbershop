// T-4463: durable-адаптер закритого циклу відгуку поверх `FeedbackSubmission`.
//
// Схема зберігає скалярні поля: оцінку й текст у `FeedbackWindow`, модерацію
// вітрини в `FeedbackSubmission`. Історію оцінок і надіслані запити повторної
// оцінки вона не тримає, тому адаптер відновлює стан best-effort (одна
// початкова оцінка, без дедуплікації запитів). Повна історія лишається за
// in-memory репозиторієм, який підключений у модулі, доки для неї не з'явиться
// окрема колонка/таблиця; порт `ReviewRevaluationRepository` не змінюється.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ReviewRevaluationRepository } from '../review-revaluation.service';
import {
  SHOWCASE_MIN_RATING,
  type ReviewRevaluation,
  type ShowcaseState,
} from '../review-revaluation.policy';

interface SubmissionRecord {
  id: string;
  feedbackId: string;
  feedback: {
    rating: number;
    text: string | null;
    createdAt: Date;
  } | null;
  processedAt: Date | null;
  processedBy: string | null;
  showcaseModerated: boolean;
  moderatedBy: string | null;
  moderatedAt: Date | null;
  moderationNote: string | null;
}

function toShowcase(record: SubmissionRecord, rating: number): ShowcaseState {
  if (record.moderatedAt) return record.showcaseModerated ? 'approved' : 'rejected';
  return rating >= SHOWCASE_MIN_RATING ? 'pending' : 'not_requested';
}

function toState(record: SubmissionRecord): ReviewRevaluation | null {
  if (!record.feedback) return null;
  const rating = record.feedback.rating;
  const state: ReviewRevaluation = {
    reviewId: record.id,
    originalRating: rating,
    currentRating: rating,
    text: record.feedback.text ?? '',
    history: [{ at: record.feedback.createdAt, rating, source: 'initial' }],
    prompts: [],
    showcase: toShowcase(record, rating),
  };
  if (record.processedAt) state.closedAt = record.processedAt;
  if (record.processedBy) state.closedBy = record.processedBy;
  if (record.moderatedBy) state.moderatedBy = record.moderatedBy;
  if (record.moderatedAt) state.moderatedAt = record.moderatedAt;
  if (record.moderationNote) state.moderationNote = record.moderationNote;
  return state;
}

@Injectable()
export class PrismaReviewRevaluationRepository implements ReviewRevaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(reviewId: string): Promise<ReviewRevaluation | null> {
    const record = await this.prisma.feedbackSubmission.findUnique({
      where: { id: reviewId },
      include: { feedback: true },
    });
    return record ? toState(record) : null;
  }

  async save(state: ReviewRevaluation): Promise<void> {
    const existing = await this.prisma.feedbackSubmission.findUnique({
      where: { id: state.reviewId },
    });
    if (!existing) {
      // Рядки не вигадуємо: вікно відгуку створює feedback-слайс, інакше в
      // базі з'явився б елемент без візиту й клієнта.
      throw new Error(
        `Review ${state.reviewId} has no feedback submission; persist the review before its revaluation state`
      );
    }

    await this.prisma.feedbackSubmission.update({
      where: { id: state.reviewId },
      data: {
        showcaseModerated: state.showcase === 'approved',
        moderatedBy: state.moderatedBy ?? null,
        moderatedAt: state.moderatedAt ?? null,
        moderationNote: state.moderationNote ?? null,
      },
    });

    await this.prisma.feedbackWindow.update({
      where: { id: existing.feedbackId },
      data: { rating: state.currentRating, text: state.text },
    });
  }

  async list(): Promise<ReviewRevaluation[]> {
    const records = await this.prisma.feedbackSubmission.findMany({
      include: { feedback: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toState).filter((state): state is ReviewRevaluation => state !== null);
  }
}
