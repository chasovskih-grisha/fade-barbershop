// Специфікації контролера клієнтського профілю (T-??): GET /identity/profile,
// PATCH /identity/profile/name, PATCH /identity/profile/preferences. Канали доступу
// гварда — client-session.guard.spec.ts; CRM-експешн-фільтр — crm.exception-filter.ts.
import { makeClientProfileController } from './client-profile.controller.env';
import { ClientProfile } from '../../crm/domain/client-profile';
import type { Request } from 'express';
import { clientSessionOf } from './client-session.guard';
import { PROFILE_1, USER_CLIENT, UUID_V7_RE, testId } from '../application/test-ids';

const T0 = new Date('2026-09-29T10:00:00.000Z');
function reqOf(session: {
  userId: string;
  sessionId: string;
}): Request & { clientSession?: { userId: string; sessionId: string } } {
  return { clientSession: session } as never;
}

describe('ClientProfileController (T-??): клієнтський профіль', () => {
  const env = makeClientProfileController();

  it('GET profile: повертає профіль гостя за userId сесії', async () => {
    const req = reqOf(env.session);
    const result = await env.controller.getProfile(req);

    expect(result).toEqual({
      id: PROFILE_1,
      userId: USER_CLIENT,
      name: 'Олег',
      phone: '+380671111111',
      birthday: null,
      preferences: [],
      vipDiscountPercent: null,
      loyaltyVisitsCount: 2,
      createdAt: '2026-09-29T10:00:00.000Z',
      updatedAt: '2026-09-29T10:00:00.000Z',
    });
  });

  it('GET profile: профіль відсутний — ClientProfileNotFoundError (фільтр дасть 404)', async () => {
    const saved = env.profiles.store.get(PROFILE_1);
    const missing = testId();
    env.profiles.store.clear();
    try {
      const req = reqOf({ userId: missing, sessionId: testId() });
      await expect(env.controller.getProfile(req)).rejects.toThrow(
        `Client profile ${missing} not found`
      );
    } finally {
      if (saved) env.profiles.store.set(PROFILE_1, saved);
    }
  });

  it('PATCH name: оновлює імʼя профілю', async () => {
    const req = reqOf(env.session);
    const result = await env.controller.patchName(req, { name: 'Марія' });

    expect(result.name).toBe('Марія');
    expect(env.profiles.store.get(PROFILE_1)?.name).toBe('Марія');
  });

  it('PATCH name: null імʼя очищує поле', async () => {
    // Профіль з унікальним userId — updateProfile шукає по clientId (id профілю).
    const anonId = testId();
    const anonProfileId = testId();
    env.profiles.store.set(
      anonProfileId,
      ClientProfile.reconstitute({
        id: anonProfileId as never,
        userId: anonId,
        name: 'Тимчасово',
        phone: '+380671111111',
        preferences: [],
        notes: [],
        vipDiscountPercent: null,
        loyaltyVisitsCount: 0,
        createdAt: T0,
        updatedAt: T0,
      }) as never
    );
    const anonSession = { userId: anonId, sessionId: testId() };
    await env.controller.patchName(reqOf(anonSession), { name: null as unknown as string });
    expect(env.profiles.store.get(anonProfileId)!.name).toBeNull();
  });

  it('PATCH name: профіль відсутний — ClientProfileNotFoundError', async () => {
    const missing = testId();
    const req = reqOf({ userId: missing, sessionId: testId() });
    await expect(env.controller.patchName(req, { name: 'Хтось' })).rejects.toThrow(
      `Client profile ${missing} not found`
    );
  });

  it('PATCH preferences: замінює список вподобань', async () => {
    const req = reqOf(env.session);
    const result = await env.controller.patchPreferences(req, {
      preferences: ['стильний футь', 'без зайвих запитань'],
    });

    expect(result.preferences).toHaveLength(2);
    expect(result.preferences.map((p) => p.text)).toEqual(['стильний футь', 'без зайвих запитань']);
    expect(result.preferences[0]!.id).toMatch(UUID_V7_RE);
    expect((await env.profiles.findById(PROFILE_1)!)!.preferences).toHaveLength(2);
    expect(env.events.map((e) => e.type)).toEqual(['crm.preferences.updated']);
  });

  it('PATCH preferences: пустий масив очищує вподобання', async () => {
    const req = reqOf(env.session);
    await env.controller.patchPreferences(req, { preferences: ['перше'] });
    await env.controller.patchPreferences(req, { preferences: [] });

    expect((await env.profiles.findById(PROFILE_1)!)!.preferences).toHaveLength(0);
  });

  it('PATCH preferences: профіль відсутний — ClientProfileNotFoundError', async () => {
    const missing = testId();
    const req = reqOf({ userId: missing, sessionId: testId() });
    await expect(env.controller.patchPreferences(req, { preferences: ['щось'] })).rejects.toThrow(
      `Client profile ${missing} not found`
    );
  });

  it('без clientSession — Unauthorized (гвард обовʼязковий)', () => {
    expect(clientSessionOf({} as Request)).toBeUndefined();
  });
});
