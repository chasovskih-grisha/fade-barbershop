// Фото відгуку (T-150a): спершу валідація типу й розміру, потім запис у
// приватний бакет, у відгуку лишається посилання. Показ — лише власнику й лише
// через короткоживучий підписаний URL; видалення відгуку прибирає об'єкти, поки
// вікно відкрите (FDB-003).
import { Inject, Injectable } from '@nestjs/common';
import {
  MAX_FEEDBACK_PHOTOS,
  PHOTO_URL_TTL_SECONDS,
  PhotoNotFound,
  TooManyPhotos,
  assertPhotoAcceptable,
  photoRefsOf,
  type FeedbackPhotoRef,
} from '../domain/feedback-photo';
import {
  FeedbackWindowClosed,
  effectiveStatus,
  type FeedbackWindowRecord,
} from '../domain/feedback-window';
import { FEEDBACK_WINDOWS, type FeedbackWindowRepository } from './ports';
import { FEEDBACK_PHOTOS, type FeedbackPhotoStorage } from './photo-port';
import type { FeedbackWindowService } from './feedback-window.service';

export type AddPhotoInput = {
  appointmentId: string;
  userId: string;
  contentType: string;
  bytes: Uint8Array;
};

@Injectable()
export class FeedbackPhotoService {
  constructor(
    @Inject(FEEDBACK_WINDOWS) private readonly windows: FeedbackWindowRepository,
    @Inject(FEEDBACK_PHOTOS) private readonly storage: FeedbackPhotoStorage,
    private readonly windowService: FeedbackWindowService
  ) {}

  async addPhoto(input: AddPhotoInput): Promise<{ photo: FeedbackPhotoRef; url: string }> {
    assertPhotoAcceptable(input.contentType, input.bytes);

    const record = await this.openRecord(input.appointmentId, input.userId);
    const photos = photoRefsOf(record);
    if (photos.length >= MAX_FEEDBACK_PHOTOS) throw new TooManyPhotos();

    const stored = await this.storage.put({
      bytes: input.bytes,
      contentType: input.contentType,
      ownerId: record.clientId,
    });
    const photo = { id: stored.objectKey, sortOrder: photos.length };
    await this.windows.savePhotos(record.id, [...photos, photo]);
    return { photo, url: await this.storage.signedUrl(photo.id, PHOTO_URL_TTL_SECONDS) };
  }

  /** Власник бачить своє фото у будь-який момент; чужому — 403 через вікно. */
  async urlFor(input: {
    appointmentId: string;
    userId: string;
    photoId: string;
  }): Promise<{ url: string; expiresInSeconds: number }> {
    const record = await this.windowService.recordFor(input.appointmentId, input.userId);
    const photo = photoRefsOf(record).find((ref) => ref.id === input.photoId);
    if (!photo) throw new PhotoNotFound();
    return {
      url: await this.storage.signedUrl(photo.id, PHOTO_URL_TTL_SECONDS),
      expiresInSeconds: PHOTO_URL_TTL_SECONDS,
    };
  }

  private async openRecord(appointmentId: string, userId: string): Promise<FeedbackWindowRecord> {
    const record = await this.windowService.recordFor(appointmentId, userId);
    const status = effectiveStatus(record);
    if (status !== 'open' && status !== 'submitted') throw new FeedbackWindowClosed(status);
    return record;
  }
}
