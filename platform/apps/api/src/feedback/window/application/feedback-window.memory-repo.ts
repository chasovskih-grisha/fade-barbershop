// Памʼять замість Prisma для спеки вікон відгуку (T-150): той самий порт, що
// й у продакшн-адаптера. Винесено зі спеки за LOC-гейтом.
import type { FeedbackWindowRecord, FeedbackWindowStatus } from '../domain/feedback-window';
import type { FeedbackPhotoRef } from '../domain/feedback-photo';
import type { FeedbackWindowRepository, OpenWindowInput, SubmissionInput } from './ports';

export class MemoryWindows implements FeedbackWindowRepository {
  readonly rows = new Map<string, FeedbackWindowRecord>();
  private seq = 0;

  async findByAppointment(appointmentId: string): Promise<FeedbackWindowRecord | null> {
    return [...this.rows.values()].find((row) => row.appointmentId === appointmentId) ?? null;
  }

  async create(input: OpenWindowInput): Promise<FeedbackWindowRecord> {
    const row: FeedbackWindowRecord = {
      ...input,
      status: 'open' as FeedbackWindowStatus,
      remindedAt: null,
      submittedAt: null,
      rating: null,
      text: null,
      photos: [],
      id: input.id || `win-${++this.seq}`,
    };
    this.rows.set(row.id, row);
    return row;
  }

  async saveSubmission(id: string, input: SubmissionInput): Promise<FeedbackWindowRecord> {
    const row = this.rows.get(id)!;
    const next: FeedbackWindowRecord = {
      ...row,
      rating: input.rating,
      text: input.text,
      photos: input.photos,
      submittedAt: input.submittedAt,
      status: input.status,
    };
    this.rows.set(id, next);
    return next;
  }

  async savePhotos(id: string, photos: FeedbackPhotoRef[]): Promise<FeedbackWindowRecord> {
    const next = { ...this.rows.get(id)!, photos };
    this.rows.set(id, next);
    return next;
  }

  async clearSubmission(id: string): Promise<FeedbackWindowRecord> {
    const next = {
      ...this.rows.get(id)!,
      rating: null,
      text: null,
      photos: [],
      submittedAt: null,
      status: 'open' as FeedbackWindowStatus,
    };
    this.rows.set(id, next);
    return next;
  }

  async markReminded(id: string, at: Date): Promise<FeedbackWindowRecord | null> {
    const row = this.rows.get(id)!;
    if (row.remindedAt) return null;
    const next = { ...row, remindedAt: at };
    this.rows.set(id, next);
    return next;
  }

  async expireOverdue(now: Date): Promise<number> {
    let count = 0;
    for (const [id, row] of this.rows) {
      if (row.status === 'open' && row.windowEndsAt < now) {
        this.rows.set(id, { ...row, status: 'expired' });
        count += 1;
      }
    }
    return count;
  }
}
