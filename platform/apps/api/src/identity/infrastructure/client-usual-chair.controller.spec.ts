// Специфікація звичної локації/барбера (T-4725b): PATCH
// /identity/profile/usual-chair зберігає пару, порожнє значення очищає лише
// своє поле, друге лишається, і нічого не надсилається (без outbox-події).
import { makeClientProfileController } from './client-profile.controller.env';
import { PROFILE_1, UUID_V7_RE, testId } from '../application/test-ids';
import type { Request } from 'express';

function reqOf(session: {
  userId: string;
  sessionId: string;
}): Request & { clientSession?: { userId: string; sessionId: string } } {
  return { clientSession: session } as never;
}

describe('ClientUsualChairController (T-4725b): звична локація і барбер', () => {
  const env = makeClientProfileController();
  const locationId = testId();
  const barberId = testId();

  beforeEach(() => {
    const profile = env.profiles.store.get(PROFILE_1);
    profile?.setUsualChair({ locationId: null, barberId: null }, { now: () => new Date(0) });
  });

  it('зберігає локацію і барбера та повертає їх у профілі', async () => {
    const req = reqOf(env.session);
    const result = await env.usualChair.patchUsualChair(req, { locationId, barberId });

    expect(result.usualChair).toEqual({ locationId, barberId });
    expect(env.profiles.store.get(PROFILE_1)?.usualChair).toEqual({ locationId, barberId });
  });

  it('порожнє значення очищає обране і це реальний вибір, а не помилка', async () => {
    const req = reqOf(env.session);
    await env.usualChair.patchUsualChair(req, { locationId, barberId });
    const cleared = await env.usualChair.patchUsualChair(req, { locationId: null, barberId: null });

    expect(cleared.usualChair).toEqual({ locationId: null, barberId: null });
    expect(env.profiles.store.get(PROFILE_1)?.usualChair).toEqual({
      locationId: null,
      barberId: null,
    });
  });

  it('поле, якого немає в тілі, не змінюється', async () => {
    const req = reqOf(env.session);
    await env.usualChair.patchUsualChair(req, { locationId, barberId });
    const afterBarberOnly = await env.usualChair.patchUsualChair(req, { barberId: null });

    expect(afterBarberOnly.usualChair).toEqual({ locationId, barberId: null });
  });

  it('очищення не чіпає id, який уже не резолвиться (лишається в сховищі)', async () => {
    const req = reqOf(env.session);
    const gone = testId();
    await env.usualChair.patchUsualChair(req, { locationId: gone, barberId: null });

    expect(env.profiles.store.get(PROFILE_1)?.usualChair.locationId).toBe(gone);
    expect(gone).toMatch(UUID_V7_RE);
  });

  it('збереження не надсилає повідомлення (жодної події outbox)', async () => {
    env.events.length = 0;
    const req = reqOf(env.session);
    await env.usualChair.patchUsualChair(req, { locationId, barberId });

    expect(env.events).toHaveLength(0);
  });
});
