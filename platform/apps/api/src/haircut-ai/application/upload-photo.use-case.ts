// UploadPhoto — прийом референсного фото клієнта (T-043, REF-WEB-01/05;
// ADR 0008 §2: master-копія в нашому приватному бакеті, у Postgres — метадані).
// Фото стає агрегатом SourcePhoto: клієнт отримує photoId (uuid), який і в
// підтвердженні запису (reference.haircutReferenceId), і в AI-генерації.
//
// Згода на AI-обробку НЕ ставиться тут (AI-WEB-02) — це окремий крок
// GiveConsentHandler; завантаження ≠ згода.

import { Injectable } from '@nestjs/common';
import { SourcePhoto } from '../domain/source-photo';
import type {
  Clock,
  IdGenerator,
  Outbox,
  PhotoStorage,
  SourcePhotoRepository,
  UnitOfWork,
} from '../domain/ports';
import { InvalidPhotoError } from './photo-errors';
import { readPhotoDimensions } from '../domain/photo-dimensions';

/** Дозволені формати (ADR 0015 §1 — той самий список, що для відгуків). */
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Ліміт розміру — 10 МБ (REF-WEB-05, ADR 0015 §1). */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Мінімальна сторона фото (AI-WEB-01: ~800×800, обличчя в кадрі). */
const MIN_SIDE_PX = 800;

/** Гість без сесії (публічний booking-флоу, T-041) — фото не потрапить у кабінет. */
export const ANONYMOUS_OWNER = 'anonymous';

export interface UploadPhotoInput {
  bytes: Uint8Array;
  contentType: string;
  /** ID клієнта-власника (identity User). Порожній — dev-режим без сесії. */
  ownerId: string;
}

export interface UploadPhotoOutput {
  /** ID фото — клієнт передає його як haircutReferenceId у підтвердженні запису. */
  photoId: string;
  objectKey: string;
}

export interface UploadPhotoDeps {
  storage: PhotoStorage;
  photos: SourcePhotoRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

@Injectable()
export class UploadPhoto {
  constructor(private readonly deps: UploadPhotoDeps) {}

  async execute(input: UploadPhotoInput): Promise<UploadPhotoOutput> {
    validate(input);
    const { storage, photos, outbox, clock, ids, uow } = this.deps;
    const ownerId = input.ownerId || ANONYMOUS_OWNER;

    return uow.run(async () => {
      const stored = await storage.put({
        bytes: input.bytes,
        contentType: input.contentType,
        ownerId,
      });
      const photo = SourcePhoto.create({ ownerId, meta: stored, clock, ids });
      await photos.save(photo);
      await outbox.append([photo.uploadedEvent(clock.now())]);
      return { photoId: photo.id, objectKey: photo.objectKey };
    });
  }
}

function validate(input: UploadPhotoInput): void {
  const allowed: readonly string[] = ALLOWED_CONTENT_TYPES;
  if (!allowed.includes(input.contentType)) {
    throw new InvalidPhotoError('Підтримуються лише jpg, png та webp');
  }
  if (input.bytes.byteLength === 0) throw new InvalidPhotoError('Файл порожній');
  if (input.bytes.byteLength > MAX_SIZE_BYTES) {
    throw new InvalidPhotoError('Розмір файлу не може перевищувати 10 МБ');
  }
  const dimensions = readPhotoDimensions(input.bytes);
  if (dimensions && (dimensions.width < MIN_SIDE_PX || dimensions.height < MIN_SIDE_PX)) {
    throw new InvalidPhotoError('Фото замале: потрібно щонайменше 800×800');
  }
}
