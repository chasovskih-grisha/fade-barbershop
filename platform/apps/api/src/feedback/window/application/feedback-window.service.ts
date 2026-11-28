// Застосунковий шар вікон відгуку (T-150). Один сценарій — одна транзакція:
// відкриття ідемпотентне за `appointmentId` (ADR 0016), подання перевіряє
// власника й дедлайн, нагадування не більше одного на вікно.
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  FeedbackWindowClosed,
  FeedbackWindowNotFound,
  NotTheWindowOwner,
  effectiveStatus,
  reminderDueAt,
  reminderIsDue,
  windowEndsAtFor,
  type FeedbackWindowRecord,
  type FeedbackWindowView,
} from '../domain/feedback-window';
import { FEEDBACK_WINDOWS, type FeedbackWindowRepository } from './ports';
import { selectPhotos } from '../domain/feedback-photo';
import type { OpenFeedbackWindowInput, SubmitFeedbackInput } from './feedback-window.inputs';
import { validate, viewOf } from './feedback-window.view';

@Injectable()
export class FeedbackWindowService {
  constructor(@Inject(FEEDBACK_WINDOWS) private readonly windows: FeedbackWindowRepository) {}

  /** Повторна доставка `AppointmentCompleted` не створює друге вікно. */
  async open(
    input: OpenFeedbackWindowInput
  ): Promise<{ created: boolean; window: FeedbackWindowView }> {
    const existing = await this.windows.findByAppointment(input.appointmentId);
    if (existing) return { created: false, window: viewOf(existing) };
    const completedAt = input.completedAt ?? new Date();
    const created = await this.windows.create({
      id: uuidv7(),
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      barberId: input.barberId ?? null,
      locationId: input.locationId ?? null,
      completedAt,
      windowEndsAt: windowEndsAtFor(completedAt, input.windowDays),
    });
    return { created: true, window: viewOf(created) };
  }

  async viewFor(appointmentId: string, userId: string): Promise<FeedbackWindowView> {
    return viewOf(await this.recordFor(appointmentId, userId));
  }

  /** Перше подання — `submitted`; повторне редагує, поки вікно відкрите (FDB-002). */
  async submit(input: SubmitFeedbackInput): Promise<FeedbackWindowView> {
    validate(input);
    const record = await this.recordFor(input.appointmentId, input.userId);
    const status = effectiveStatus(record);
    if (status !== 'open' && status !== 'submitted') throw new FeedbackWindowClosed(status);
    const saved = await this.windows.saveSubmission(record.id, {
      rating: input.rating,
      text: input.text.trim(),
      photos: selectPhotos(record, input.photoIds ?? []),
      submittedAt: record.submittedAt ?? new Date(),
      status: 'submitted',
    });
    return viewOf(saved);
  }

  /** Планувальник push: `due` лише раз на вікно, рівно після 2 годин. */
  async reminderFor(
    appointmentId: string,
    now = new Date()
  ): Promise<{ due: boolean; clientId: string; windowId: string; dueAt: string }> {
    const record = await this.windows.findByAppointment(appointmentId);
    if (!record) throw new FeedbackWindowNotFound();
    const base = {
      clientId: record.clientId,
      windowId: record.id,
      dueAt: reminderDueAt(record.completedAt).toISOString(),
    };
    if (!reminderIsDue(record, now)) return { due: false, ...base };
    const marked = await this.windows.markReminded(record.id, now);
    return { due: marked !== null, ...base };
  }

  async expireOverdue(now = new Date()): Promise<{ expired: number }> {
    return { expired: await this.windows.expireOverdue(now) };
  }

  /** Вікно власника; чуже вікно — 403 (використовує і сервіс фото, T-150a). */
  async recordFor(appointmentId: string, userId: string): Promise<FeedbackWindowRecord> {
    const record = await this.windows.findByAppointment(appointmentId);
    if (!record) throw new FeedbackWindowNotFound();
    if (record.clientId !== userId) throw new NotTheWindowOwner();
    return record;
  }
}
