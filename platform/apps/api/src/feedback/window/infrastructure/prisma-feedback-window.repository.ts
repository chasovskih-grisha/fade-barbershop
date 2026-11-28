// Prisma-адаптер вікон відгуку (T-150): лише запити й мапінг рядків.
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { FeedbackWindowRecord } from '../domain/feedback-window';
import { toRecord, type Row } from './feedback-window.row';
import type {
  FeedbackWindowRepository,
  OpenWindowInput,
  SubmissionInput,
} from '../application/ports';
import type { FeedbackPhotoRef } from '../domain/feedback-photo';

@Injectable()
export class PrismaFeedbackWindowRepository implements FeedbackWindowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAppointment(appointmentId: string): Promise<FeedbackWindowRecord | null> {
    const row = await this.prisma.feedbackRequestWindow.findUnique({ where: { appointmentId } });
    return row ? toRecord(row as Row) : null;
  }

  async create(input: OpenWindowInput): Promise<FeedbackWindowRecord> {
    const row = await this.prisma.feedbackRequestWindow.create({
      data: {
        id: input.id,
        appointmentId: input.appointmentId,
        clientId: input.clientId,
        barberId: input.barberId,
        locationId: input.locationId,
        completedAt: input.completedAt,
        windowEndsAt: input.windowEndsAt,
      },
    });
    return toRecord(row as Row);
  }

  saveSubmission(id: string, input: SubmissionInput): Promise<FeedbackWindowRecord> {
    return this.write(id, {
      rating: input.rating,
      text: input.text,
      photos: input.photos,
      submittedAt: input.submittedAt,
      status: input.status,
    });
  }

  async savePhotos(id: string, photos: FeedbackPhotoRef[]): Promise<FeedbackWindowRecord> {
    return this.write(id, { photos });
  }

  clearSubmission(id: string): Promise<FeedbackWindowRecord> {
    return this.write(id, {
      rating: null,
      text: null,
      photos: [],
      submittedAt: null,
      status: 'open',
    });
  }

  private async write(
    id: string,
    data: Prisma.FeedbackRequestWindowUpdateInput
  ): Promise<FeedbackWindowRecord> {
    const row = await this.prisma.feedbackRequestWindow.update({ where: { id }, data });
    return toRecord(row as Row);
  }

  async markReminded(id: string, at: Date): Promise<FeedbackWindowRecord | null> {
    const result = await this.prisma.feedbackRequestWindow.updateMany({
      where: { id, remindedAt: null },
      data: { remindedAt: at },
    });
    if (result.count === 0) return null;
    const row = await this.prisma.feedbackRequestWindow.findUnique({ where: { id } });
    return row ? toRecord(row as Row) : null;
  }

  async expireOverdue(now: Date): Promise<number> {
    const result = await this.prisma.feedbackRequestWindow.updateMany({
      where: { status: 'open', windowEndsAt: { lt: now } },
      data: { status: 'expired' },
    });
    return result.count;
  }
}
