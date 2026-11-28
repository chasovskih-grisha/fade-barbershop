// Помилки вікна відгуку → HTTP (T-150): немає вікна — 404, чуже вікно — 403,
// закрите вікно — 409, кривий відгук — 400. Невідому помилку не ковтаємо.
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  FeedbackWindowClosed,
  FeedbackWindowNotFound,
  InvalidFeedback,
  NotTheWindowOwner,
} from '../domain/feedback-window';

export const toFeedbackWindowHttp = (error: unknown): unknown => {
  if (error instanceof FeedbackWindowNotFound) return new NotFoundException(error.message);
  if (error instanceof NotTheWindowOwner) return new ForbiddenException(error.message);
  if (error instanceof FeedbackWindowClosed) return new ConflictException(error.message);
  if (error instanceof InvalidFeedback) return new BadRequestException(error.message);
  return error;
};
