// Функціональні тести ManageConsent (T-051/052, AI-WEB-02/07): згода зберігається
// разом із фото, аудит у outbox, власність із сесії.

import { GiveConsentHandler, RevokeConsentHandler } from './manage-consent';
import { PhotoAlreadyDeletedError, SourcePhotoNotFoundError } from './haircut-errors';
import { InMemoryPhotos, RecordingOutbox, noTransaction } from './fakes';
import { makePhoto, testClock } from './test-fixtures';

function build() {
  const photos = new InMemoryPhotos();
  const outbox = new RecordingOutbox();
  const deps = { photos, outbox, clock: testClock, uow: noTransaction };
  return {
    photos,
    outbox,
    give: new GiveConsentHandler(deps),
    revoke: new RevokeConsentHandler(deps),
  };
}

describe('GiveConsent (AI-WEB-02)', () => {
  it('згода зберігається разом із фото і пише подію', async () => {
    const { photos, outbox, give } = build();
    photos.seed(makePhoto({ consentGranted: false, consentGrantedAt: null }));

    const result = await give.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(result.success).toBe(true);
    expect(photos.rows.get('photo-1')?.canGenerate).toBe(true);
    expect(outbox.types()).toEqual(['haircut-ai.consent.changed']);
  });

  it('повторна згода — ідемпотентно, без другої події', async () => {
    const { photos, outbox, give } = build();
    photos.seed(makePhoto());

    await give.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(outbox.events).toHaveLength(0);
  });

  it('чуже фото — NotFound (власність із сесії, не з тіла запиту)', async () => {
    const { photos, give } = build();
    photos.seed(makePhoto());
    await expect(give.handle({ sourcePhotoId: 'photo-1', ownerId: 'attacker' })).rejects.toThrow(
      SourcePhotoNotFoundError
    );
  });

  it('видалене фото — PhotoAlreadyDeletedError', async () => {
    const { photos, give } = build();
    photos.seed(makePhoto({ deletedAt: testClock.now() }));
    await expect(give.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' })).rejects.toThrow(
      PhotoAlreadyDeletedError
    );
  });
});

describe('RevokeConsent (AI-WEB-07)', () => {
  it('відкликання згоди закриває canGenerate', async () => {
    const { photos, outbox, revoke } = build();
    photos.seed(makePhoto());

    await revoke.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(photos.rows.get('photo-1')?.canGenerate).toBe(false);
    expect(outbox.types()).toEqual(['haircut-ai.consent.changed']);
  });

  it('відкликання без згоди — без події', async () => {
    const { photos, outbox, revoke } = build();
    photos.seed(makePhoto({ consentGranted: false, consentGrantedAt: null }));

    await revoke.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(outbox.events).toHaveLength(0);
  });

  it('після відкликання генерація більше не проходить (спільний інваріант з request)', async () => {
    const { photos, revoke } = build();
    photos.seed(makePhoto());

    await revoke.handle({ sourcePhotoId: 'photo-1', ownerId: 'user-1' });

    expect(photos.rows.get('photo-1')?.canGenerate).toBe(false);
  });
});
