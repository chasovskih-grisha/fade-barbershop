// SourcePhoto — фото клієнта-референс: master-копія в НАШОМУ приватному бакеті
// (ADR 0008 §2), у Postgres — лише метадані. Агрегат зберігає згоду на AI-обробку
// (AI-WEB-02) і факт видалення (soft-delete: об'єкти чистить ретеншен-воркер).
//
// Мутації — як у crm/client-profile: змінюють props на місці, повертають доменну
// подію (або null, коли перехід неможливий). Репозиторій зберігає той самий інстанс.

import type { Clock, IdGenerator, StoredPhotoMeta } from './ports';
import { PhotoUploaded } from './events';
import type { ConsentChanged, PhotoDeleted } from './events';
import { givePhotoConsent, revokePhotoConsent, markPhotoDeleted } from './source-photo-mutations';
import type { PhotoDeleteReason, SourcePhotoProps } from './source-photo-props';

export type { PhotoDeleteReason, SourcePhotoProps } from './source-photo-props';

export class SourcePhoto {
  private constructor(private readonly props: SourcePhotoProps) {}

  static create(input: {
    ownerId: string;
    meta: StoredPhotoMeta;
    clock: Clock;
    ids: IdGenerator;
  }): SourcePhoto {
    const now = input.clock.now();
    return new SourcePhoto({
      id: input.ids.id(),
      ownerId: input.ownerId,
      objectKey: input.meta.objectKey,
      bucket: input.meta.bucket,
      contentType: input.meta.contentType,
      sizeBytes: input.meta.sizeBytes,
      // Згода — окремий крок (AI-WEB-02): завантаження ≠ згода на AI-обробку.
      consentGranted: false,
      consentGrantedAt: null,
      consentRevokedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: SourcePhotoProps): SourcePhoto {
    return new SourcePhoto(props);
  }

  // prettier-ignore
  get id(): string { return this.props.id; }
  // prettier-ignore
  get ownerId(): string { return this.props.ownerId; }
  // prettier-ignore
  get objectKey(): string { return this.props.objectKey; }
  // prettier-ignore
  get contentType(): string { return this.props.contentType; }
  // prettier-ignore
  get consentGranted(): boolean { return this.props.consentGranted; }
  // prettier-ignore
  get createdAt(): Date { return this.props.createdAt; }
  // prettier-ignore
  get updatedAt(): Date { return this.props.updatedAt; }
  // prettier-ignore
  get consentGrantedAt(): Date | null { return this.props.consentGrantedAt; }
  // prettier-ignore
  get isDeleted(): boolean { return this.props.deletedAt !== null; }
  /** AI-генерація дозволлена лише за наявності згоди на живому фото. */
  // prettier-ignore
  get canGenerate(): boolean { return this.props.consentGranted && this.props.deletedAt === null; }
  get propsData(): SourcePhotoProps {
    return { ...this.props };
  }

  /** Подія факту завантаження — для outbox одразу після create(). */
  uploadedEvent(now: Date): PhotoUploaded {
    // prettier-ignore
    return new PhotoUploaded({ sourcePhotoId: this.props.id, ownerId: this.props.ownerId, objectKey: this.props.objectKey, contentType: this.props.contentType, sizeBytes: this.props.sizeBytes, occurredAt: now });
  }

  giveConsent(clock: Clock): ConsentChanged | null {
    return givePhotoConsent(this.props, clock);
  }

  revokeConsent(clock: Clock): ConsentChanged | null {
    return revokePhotoConsent(this.props, clock);
  }

  markDeleted(
    clock: Clock,
    reason: PhotoDeleteReason,
    extraObjectKeys: readonly string[]
  ): PhotoDeleted | null {
    return markPhotoDeleted(this.props, { clock, reason, extraObjectKeys });
  }
}
