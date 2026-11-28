// Публічне подання вікна і валідація відгуку (T-150). Окремо від сервісу за
// LOC-гейтом: сервіс лишається про сценарії, тут — форма відповіді й правила.
import {
  MAX_PHOTOS,
  MAX_TEXT_LENGTH,
  InvalidFeedback,
  daysRemaining,
  effectiveStatus,
  type FeedbackWindowRecord,
  type FeedbackWindowView,
} from '../domain/feedback-window';
import type { SubmitFeedbackInput } from './feedback-window.inputs';

export const validate = (input: SubmitFeedbackInput): void => {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    throw new InvalidFeedback('rating');
  if (String(input.text ?? '').length > MAX_TEXT_LENGTH) throw new InvalidFeedback('text');
  if ((input.photoIds ?? []).length > MAX_PHOTOS) throw new InvalidFeedback('photos');
};

export const viewOf = (record: FeedbackWindowRecord, now = new Date()): FeedbackWindowView => ({
  id: record.id,
  appointmentId: record.appointmentId,
  clientId: record.clientId,
  completedAt: record.completedAt.toISOString(),
  windowEndsAt: record.windowEndsAt.toISOString(),
  status: effectiveStatus(record, now),
  remindedAt: record.remindedAt?.toISOString() ?? null,
  submittedAt: record.submittedAt?.toISOString() ?? null,
  rating: record.rating,
  text: record.text,
  photos: Array.isArray(record.photos) ? (record.photos as string[]) : [],
  daysRemaining: daysRemaining(record.windowEndsAt, now),
});
