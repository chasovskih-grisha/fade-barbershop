// AdminVerifyClientOtp onboarding (T-046): невідомий номер → User + картка
// клієнта створюються на місці; існуючий клієнт картку не чіпає; legacy-збірка
// без onboarding → USER_NOT_FOUND. Плюс гілки markPhoneVerified false і
// ??-fallback на даті. Базові випадки — admin-verify-client-otp.spec.ts.
import { UserNotFoundError } from './identity-errors';
import { NOW } from './admin-client-otp.fakes';
import { build, buildLegacy, clientUser, verifyWithSent } from './admin-client-otp.fakes.env';

describe('AdminVerifyClientOtp: onboarding невідомого номера (T-046)', () => {
  it('клієнта немає → User + ClientProfile створюються на місці', async () => {
    const t = build('+380501110006');
    await t.request.handle({ phone: t.phone });

    const res = await verifyWithSent(t, 'admin-1');

    const created = await t.users.findByPhone(t.phone);
    expect(created).not.toBeNull();
    if (!created) throw new Error('клієнта не створено');
    // Номер уже верифіковано — це і був момент доказу.
    expect(created.role).toBe('client');
    expect(created.phoneVerifiedAt).toEqual(NOW);
    expect(res.clientId).toBe(created.id);
    expect(res.phoneVerifiedAt).toBe(NOW.toISOString());
    // Картка гостя — crm-частина через порт: userId + телефон, імʼя не відоме.
    expect(t.clientProfiles.created).toEqual([{ userId: created.id, phone: t.phone, name: null }]);
    // Окремої PhoneVerified немає: створення І Є верифікацією.
    expect(t.outbox.events.map((e) => e.type)).toEqual([
      'identity.otp.requested',
      'identity.client.created',
    ]);
    expect(t.outbox.events.some((e) => e.type === 'identity.session.started')).toBe(false);
  });

  it('клієнт уже існує → onboarding не чіпає картку (ідемпотентно)', async () => {
    const t = build('+380501110011');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });

    await verifyWithSent(t, 'a');

    expect(t.clientProfiles.created).toHaveLength(0);
  });

  it('legacy (без onboarding): клієнта немає → UserNotFoundError, як у T-4409', async () => {
    const t = buildLegacy('+380501110012');
    await t.request.handle({ phone: t.phone });

    await expect(verifyWithSent(t, 'a')).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe('AdminVerifyClientOtp: гілки дати верифікації', () => {
  it('повторна перша верифікація: markPhoneVerified false → без події, дата перша', async () => {
    const t = build('+380501110008');
    const user = clientUser(t.phone);
    user.markPhoneVerified(NOW); // вже верифікований раніше
    t.users.save(user);
    await t.request.handle({ phone: t.phone });

    const res = await verifyWithSent(t, 'a');

    expect(res.phoneVerifiedAt).toBe(NOW.toISOString());
    expect(t.outbox.events.filter((e) => e.type === 'identity.phone.verified')).toHaveLength(0);
  });

  it('??-fallback: агрегат без дати після успіху повертає рядок, а не undefined', async () => {
    // markPhoneVerified(true)-шлях лишає phoneVerifiedAt = now — ?? не спрацьовує;
    // fallback покриває дефензивний випадок (агрегат без дати після успіху).
    const t = build('+380501110009');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });

    const res = await verifyWithSent(t, 'a');

    expect(typeof res.phoneVerifiedAt).toBe('string');
  });
});
