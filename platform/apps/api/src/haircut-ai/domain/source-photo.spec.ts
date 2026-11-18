// Unit-тести агрегату SourcePhoto: згода на AI-обробку (AI-WEB-02), soft-delete
// і збирання ключів на ретеншен-чистку (AI-WEB-07). Без БД і бакета.

import { SourcePhoto } from './source-photo';
import type { Clock, IdGenerator, StoredPhotoMeta } from './ports';

const NOW = new Date('2026-03-01T10:00:00.000Z');
const LATER = new Date('2026-03-01T11:00:00.000Z');

const clock = (at = NOW): Clock => ({ now: () => at });
let counter = 0;
const ids: IdGenerator = { id: () => `id-${++counter}` };

const meta: StoredPhotoMeta = {
  objectKey: 'user-1/1709287200000/1',
  bucket: 'haircut-ai-photos',
  // prettier-ignore
  contentType: 'image/jpeg',
  sizeBytes: 2048,
};

const newPhoto = (overrides: { consentGranted?: boolean; deletedAt?: Date | null } = {}) =>
  SourcePhoto.reconstitute({
    id: 'photo-1',
    ownerId: 'user-1',
    objectKey: meta.objectKey,
    bucket: meta.bucket,
    contentType: meta.contentType,
    sizeBytes: meta.sizeBytes,
    consentGranted: overrides.consentGranted ?? false,
    consentGrantedAt: overrides.consentGranted ? NOW : null,
    consentRevokedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: overrides.deletedAt ?? null,
  });

describe('SourcePhoto.create', () => {
  it('створює фото БЕЗ згоди на AI (AI-WEB-02); uploadedEvent несе photoId', () => {
    const photo = SourcePhoto.create({ ownerId: 'user-1', meta, clock: clock(), ids });
    expect(photo.consentGranted).toBe(false);
    expect(photo.canGenerate).toBe(false);
    expect(photo.isDeleted).toBe(false);
    expect(photo.uploadedEvent(NOW).aggregateId).toBe(photo.id);
  });
});

describe('SourcePhoto — згода (AI-WEB-02/07)', () => {
  it('giveConsent відкриває генерацію і повертає подію', () => {
    const photo = newPhoto();
    const event = photo.giveConsent(clock(LATER));
    expect(photo.canGenerate).toBe(true);
    expect(event?.type).toBe('haircut-ai.consent.changed');
  });

  it('повторна згода — no-op (події немає)', () => {
    const photo = newPhoto({ consentGranted: true });
    expect(photo.giveConsent(clock(LATER))).toBeNull();
  });

  it('revokeConsent закриває генерацію', () => {
    const photo = newPhoto({ consentGranted: true });
    const event = photo.revokeConsent(clock(LATER));
    expect(photo.canGenerate).toBe(false);
    expect(event?.payload).toMatchObject({ granted: false });
  });

  it('відкликання без згоди — no-op', () => {
    expect(newPhoto().revokeConsent(clock(LATER))).toBeNull();
  });

  it('згода на видаленому фото не відкриває генерацію', () => {
    const photo = newPhoto({ deletedAt: NOW });
    expect(photo.giveConsent(clock(LATER))).toBeNull();
    expect(photo.canGenerate).toBe(false);
  });
});

describe('SourcePhoto.markDeleted (AI-WEB-07)', () => {
  it('подія містить оригінал + передані ключі варіантів', () => {
    const photo = newPhoto();
    const event = photo.markDeleted(clock(LATER), 'user_request', [
      'variants/a.svg',
      'variants/b.svg',
    ]);
    expect(photo.isDeleted).toBe(true);
    expect(event?.payload).toMatchObject({
      reason: 'user_request',
      objectKeys: [meta.objectKey, 'variants/a.svg', 'variants/b.svg'],
    });
  });

  it('повторне видалення — no-op (ретеншен-воркер може дійти двічі)', () => {
    const photo = newPhoto();
    photo.markDeleted(clock(LATER), 'user_request', []);
    expect(photo.markDeleted(clock(LATER), 'retention_policy', [])).toBeNull();
  });
});
