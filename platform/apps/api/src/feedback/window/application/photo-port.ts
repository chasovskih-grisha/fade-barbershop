// Порт сховища фото відгуку (T-150a). Сервіс не знає про S3: адаптер put/
// signedUrl/remove — єдина точка контакту з провайдером (ADR 0008 §2).
import type { StoredFeedbackPhoto } from '../domain/feedback-photo';

export const FEEDBACK_PHOTOS = 'FeedbackPhotoStorage';

export interface FeedbackPhotoStorage {
  put(input: {
    bytes: Uint8Array;
    contentType: string;
    ownerId: string;
  }): Promise<StoredFeedbackPhoto>;
  /** Короткоживучий підписаний URL; публічного посилання не існує. */
  signedUrl(objectKey: string, ttlSeconds: number): Promise<string>;
  /** Ідемпотентно: повторне видалення відсутнього об'єкта не падає. */
  remove(objectKeys: readonly string[]): Promise<void>;
}
