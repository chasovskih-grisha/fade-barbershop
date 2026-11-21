/* eslint-disable max-lines, complexity -- cohesive module (123 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 13 vs 10); refactor tracked in T-2500f */
// T-4451: durable-адаптер опрацювання відгуків поверх `FeedbackSubmission` /
// `FeedbackWindow` (міграція `20261220000000_feedback_persistence`).
//
// Схема тримає одну відповідь (`replyText`/`repliedAt`), статус і штампи
// опрацювання, тому потік відновлюється як один запис `#1`. Повторні відповіді
// живуть у пам'яті сервісу до появи окремої таблиці відповідей — контракт
// `ReviewProcessingRepository` від цього не змінюється.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ReviewProcessingRepository } from '../review-processing.service';
import type {
  ReviewProcessingStatus,
  ReviewReply,
  ReviewWorkItem,
} from '../review-processing.policy';

/**
 * `FeedbackSubmission.adminId` обов'язковий (uuid), а реєстрація відгуку ще не
 * має адміністратора. Нульовий uuid — свідомий системний актор, а не `any`.
 */
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

interface SubmissionRecord {
  id: string;
  feedbackId: string;
  adminId: string;
  status: string;
  replyText: string | null;
  repliedAt: Date | null;
  processedAt: Date | null;
  processedBy: string | null;
  feedback: {
    appointmentId: string;
    clientId: string;
    barberId: string | null;
    rating: number;
    createdAt: Date;
  } | null;
}

function toStatus(value: string): ReviewProcessingStatus {
  return value === 'processed' || value === 'archived' ? value : 'new';
}

function toReply(record: SubmissionRecord): ReviewReply[] {
  if (!record.replyText) return [];
  const repliedAt = record.repliedAt ?? record.processedAt ?? new Date();
  return [
    {
      id: `${record.id}#1`,
      reviewId: record.id,
      threadSeq: 1,
      threadId: `${record.id}#1`,
      adminId: record.processedBy ?? record.adminId,
      text: record.replyText,
      repliedAt,
    },
  ];
}

function toWorkItem(record: SubmissionRecord): ReviewWorkItem {
  const item: ReviewWorkItem = {
    id: record.id,
    appointmentId: record.feedback?.appointmentId ?? record.feedbackId,
    clientId: record.feedback?.clientId ?? '',
    rating: record.feedback?.rating ?? 0,
    submittedAt: record.feedback?.createdAt ?? record.processedAt ?? new Date(),
    status: toStatus(record.status),
    replies: toReply(record),
  };
  if (record.repliedAt) item.repliedAt = record.repliedAt;
  if (record.feedback?.barberId) item.barberId = record.feedback.barberId;
  if (record.processedAt) item.processedAt = record.processedAt;
  if (record.processedBy) item.processedBy = record.processedBy;
  return item;
}

@Injectable()
export class PrismaReviewProcessingRepository implements ReviewProcessingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(reviewId: string): Promise<ReviewWorkItem | null> {
    const record = await this.prisma.feedbackSubmission.findUnique({
      where: { id: reviewId },
      include: { feedback: true },
    });
    return record ? toWorkItem(record) : null;
  }

  async save(review: ReviewWorkItem): Promise<void> {
    const lastReply = review.replies[review.replies.length - 1];
    const existing = await this.prisma.feedbackSubmission.findUnique({ where: { id: review.id } });

    if (existing) {
      await this.prisma.feedbackSubmission.update({
        where: { id: review.id },
        data: {
          status: review.status,
          replyText: lastReply?.text ?? null,
          repliedAt: lastReply?.repliedAt ?? null,
          processedAt: review.processedAt ?? null,
          processedBy: review.processedBy ?? null,
        },
      });
      return;
    }

    // Вікно відгуку створюється тим самим слайсом: id елемента = id вікна.
    await this.prisma.feedbackWindow.upsert({
      where: { id: review.id },
      create: {
        id: review.id,
        appointmentId: review.appointmentId,
        clientId: review.clientId,
        barberId: review.barberId ?? null,
        locationId: null,
        rating: review.rating,
        text: null,
        isPublic: false,
        consentGiven: false,
        createdAt: review.submittedAt,
      },
      update: { rating: review.rating },
    });

    await this.prisma.feedbackSubmission.create({
      data: {
        id: review.id,
        feedbackId: review.id,
        adminId: lastReply?.adminId ?? review.processedBy ?? SYSTEM_ACTOR_ID,
        status: review.status,
        replyText: lastReply?.text ?? null,
        repliedAt: lastReply?.repliedAt ?? null,
        processedAt: review.processedAt ?? null,
        processedBy: review.processedBy ?? null,
      },
    });
  }

  async list(): Promise<ReviewWorkItem[]> {
    const records = await this.prisma.feedbackSubmission.findMany({
      include: { feedback: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toWorkItem);
  }
}
