// Порт сховища вікон відгуку (T-150). Домен і застосунок не знають про Prisma.
import type { FeedbackWindowRecord, FeedbackWindowStatus } from '../domain/feedback-window';
import type { FeedbackPhotoRef } from '../domain/feedback-photo';

export const FEEDBACK_WINDOWS = 'FeedbackWindowRepository';

export type OpenWindowInput = {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  locationId: string | null;
  completedAt: Date;
  windowEndsAt: Date;
};

export type SubmissionInput = {
  rating: number;
  text: string;
  photos: FeedbackPhotoRef[];
  submittedAt: Date;
  status: FeedbackWindowStatus;
};

export interface FeedbackWindowRepository {
  findByAppointment(appointmentId: string): Promise<FeedbackWindowRecord | null>;
  create(input: OpenWindowInput): Promise<FeedbackWindowRecord>;
  saveSubmission(id: string, input: SubmissionInput): Promise<FeedbackWindowRecord>;
  /** Замінює список фото відгуку (T-150a): вміст лишається посиланнями. */
  savePhotos(id: string, photos: FeedbackPhotoRef[]): Promise<FeedbackWindowRecord>;
  /** Видалення відгуку до кінця вікна (FDB-003): оцінка/текст/фото → порожньо. */
  clearSubmission(id: string): Promise<FeedbackWindowRecord>;
  /** Позначає нагадування; null — хтось уже позначив (перегони двох доставок). */
  markReminded(id: string, at: Date): Promise<FeedbackWindowRecord | null>;
  /** `open` з дедлайном у минулому → `expired`; повертає кількість змінених. */
  expireOverdue(now: Date): Promise<number>;
}
