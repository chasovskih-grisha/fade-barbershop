// Видалення фото й відгуку (T-150a, FDB-003): доки вікно не закрите, власник
// може прибрати окреме фото або весь відгук — об'єкти зникають із бакета разом
// з посиланнями у рядку. Після кінця вікна життєвий цикл закритий.
import { Inject, Injectable } from '@nestjs/common';
import {
  PhotoNotFound,
  photoRefsOf,
  withoutPhoto,
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

export type RemovalInput = { appointmentId: string; userId: string; now?: Date };

@Injectable()
export class FeedbackPhotoRemovalService {
  constructor(
    @Inject(FEEDBACK_WINDOWS) private readonly windows: FeedbackWindowRepository,
    @Inject(FEEDBACK_PHOTOS) private readonly storage: FeedbackPhotoStorage,
    private readonly windowService: FeedbackWindowService
  ) {}

  /** Прибрати одне фото до подання/поки вікно відкрите; решта зберігає порядок. */
  async removePhoto(
    input: RemovalInput & { photoId: string }
  ): Promise<{ photos: FeedbackPhotoRef[] }> {
    const record = await this.mutableWindow(input);
    const refs = photoRefsOf(record);
    const remaining = withoutPhoto(refs, input.photoId);
    if (remaining.length === refs.length) throw new PhotoNotFound();

    await this.storage.remove([input.photoId]);
    const saved = await this.windows.savePhotos(record.id, remaining);
    return { photos: photoRefsOf(saved) };
  }

  /** Видалення відгуку до кінця вікна: об'єкти з бакета і сам відгук. */
  async removeReview(input: RemovalInput): Promise<{ removedPhotos: number }> {
    const record = await this.mutableWindow(input);
    const photos = photoRefsOf(record);

    if (photos.length > 0) await this.storage.remove(photos.map((ref) => ref.id));
    await this.windows.clearSubmission(record.id);
    return { removedPhotos: photos.length };
  }

  private async mutableWindow(input: RemovalInput): Promise<FeedbackWindowRecord> {
    const record = await this.windowService.recordFor(input.appointmentId, input.userId);
    const status = effectiveStatus(record, input.now ?? new Date());
    if (status !== 'open' && status !== 'submitted') throw new FeedbackWindowClosed(status);
    return record;
  }
}
