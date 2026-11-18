// Short-lived signed URL для референсного фото клієнта (T-043, REF-WEB-03;
// ADR 0008 §2): бакет приватний, публічних URL для фото клієнтів не існує
// (AI-WEB-08) — доступ лише через підписане посилання з коротким TTL.
//
// ACL виконується ТУТ, у application-шарі (ADR 0008 §2): власник | барбер
// призначеного візиту | admin. Цей маршрут — клієнтський (у кабінеті/флоу),
// тож реалізована власна половина правила. Барберський і адмінський доступ
// належать своїм поверхням (admin-картка візиту), не цьому ендпоинту.

import type { PhotoStorage, SourcePhotoRepository } from '../domain/ports';
import { SIGNED_URL_TTL_SEC } from './ai-read-model';

/** Фото не знайдене або не належить актору — одна відповідь (ADR 0015 §1). */
export class ReferencePhotoNotFoundError extends Error {
  constructor(photoId: string) {
    super(`Reference photo not found: ${photoId}`);
    this.name = 'ReferencePhotoNotFoundError';
  }
}

export interface ReferencePhotoUrl {
  url: string;
  contentType: string;
  expiresInSeconds: number;
}

export interface GetReferencePhotoUrlDeps {
  photos: SourcePhotoRepository;
  storage: PhotoStorage;
}

export class GetReferencePhotoUrl {
  constructor(private readonly deps: GetReferencePhotoUrlDeps) {}

  async execute(input: { photoId: string; actorId: string }): Promise<ReferencePhotoUrl> {
    const { photos, storage } = this.deps;
    const photo = await photos.findById(input.photoId);
    // 404, а не 403: чужий не повинен дізнатися, що фото з таким id існує.
    // М'яко видалене (deletedAt) теж недоступне — клієнт не має бачити те,
    // що видалив (AI-WEB-07).
    if (!photo || photo.isDeleted || photo.ownerId !== input.actorId) {
      throw new ReferencePhotoNotFoundError(input.photoId);
    }
    return {
      url: await storage.signedUrl(photo.objectKey, SIGNED_URL_TTL_SEC),
      contentType: photo.contentType,
      expiresInSeconds: SIGNED_URL_TTL_SEC,
    };
  }
}
