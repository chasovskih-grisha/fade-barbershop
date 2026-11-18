// Мутації SourcePhoto: згода й soft-delete (окремо від агрегату — гейт max-lines).

import type { Clock } from './ports';
import { ConsentChanged, PhotoDeleted } from './events';
import type { PhotoDeleteReason, SourcePhotoProps } from './source-photo-props';

export function givePhotoConsent(props: SourcePhotoProps, clock: Clock): ConsentChanged | null {
  if (props.consentGranted || props.deletedAt) return null;
  const now = clock.now();
  props.consentGranted = true;
  props.consentGrantedAt = now;
  props.updatedAt = now;
  return new ConsentChanged({
    sourcePhotoId: props.id,
    ownerId: props.ownerId,
    granted: true,
    occurredAt: now,
  });
}

export function revokePhotoConsent(props: SourcePhotoProps, clock: Clock): ConsentChanged | null {
  if (!props.consentGranted) return null;
  const now = clock.now();
  props.consentGranted = false;
  props.consentRevokedAt = now;
  props.updatedAt = now;
  return new ConsentChanged({
    sourcePhotoId: props.id,
    ownerId: props.ownerId,
    granted: false,
    occurredAt: now,
  });
}

export function markPhotoDeleted(
  props: SourcePhotoProps,
  input: { clock: Clock; reason: PhotoDeleteReason; extraObjectKeys: readonly string[] }
): PhotoDeleted | null {
  if (props.deletedAt) return null;
  const now = input.clock.now();
  props.deletedAt = now;
  props.updatedAt = now;
  return new PhotoDeleted({
    sourcePhotoId: props.id,
    reason: input.reason,
    objectKeys: [props.objectKey, ...input.extraObjectKeys],
    occurredAt: now,
  });
}
