// Адаптер порту ReferencePhotoUrls на репозиторій і сховище haircut-ai
// (ADR 0017: контексти розділені, інтеграція — на рівні infra збірки моноліту;
// той самий патерн, що CrmClientProfilesAdapter в identity).
//
// Підписуємо лише живі фото: м'яко видалений референс не має повертатися в
// картку (AI-WEB-07) — тому видалені ID просто відсутні в мапі, а не дають null.

import { Injectable } from '@nestjs/common';
import { SIGNED_URL_TTL_SEC } from '../../haircut-ai/application/ai-read-model';
import { PrismaSourcePhotoRepository } from '../../haircut-ai/infrastructure/prisma-source-photo.repository';
import { S3PhotoStorage } from '../../haircut-ai/infrastructure/s3-photo-storage';
import type { ReferencePhotoUrls } from '../application/reference-photo-urls';

@Injectable()
export class HaircutAiReferencePhotoUrls implements ReferencePhotoUrls {
  constructor(
    private readonly photos: PrismaSourcePhotoRepository,
    private readonly storage: S3PhotoStorage
  ) {}

  async sign(photoIds: readonly string[]): Promise<Map<string, string>> {
    const ids = [...new Set(photoIds)];
    if (ids.length === 0) return new Map();

    // Один IN-запит замість N×findById — календарна сітка може нести десятки ID.
    const rows = await this.photos.findByIds(ids);
    const entries = await Promise.all(
      rows.map(
        async (photo) =>
          [photo.id, await this.storage.signedUrl(photo.objectKey, SIGNED_URL_TTL_SEC)] as const
      )
    );
    return new Map(entries);
  }
}
