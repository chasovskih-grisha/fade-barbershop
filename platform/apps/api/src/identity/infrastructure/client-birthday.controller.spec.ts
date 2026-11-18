// Специфікація клієнтського дня народження (T-4730b): PATCH
// /identity/profile/birthday зберігає день і місяць, очищає порожнім
// значенням, відхиляє неможливу дату і нічого не надсилає (без outbox-події).
import { makeClientProfileController } from './client-profile.controller.env';
import { PROFILE_1 } from '../application/test-ids';
import type { Request } from 'express';

function reqOf(session: {
  userId: string;
  sessionId: string;
}): Request & { clientSession?: { userId: string; sessionId: string } } {
  return { clientSession: session } as never;
}

describe('ClientBirthdayController (T-4730b): день народження профілю', () => {
  const env = makeClientProfileController();

  it('зберігає день і місяць і повертає їх у профілі', async () => {
    const req = reqOf(env.session);
    const result = await env.birthday.patchBirthday(req, { birthday: { day: 12, month: 11 } });

    expect(result.birthday).toEqual({ day: 12, month: 11 });
    expect(env.profiles.store.get(PROFILE_1)?.birthday).toEqual({ day: 12, month: 11 });
  });

  it('порожнє значення очищає збережений день народження', async () => {
    const req = reqOf(env.session);
    await env.birthday.patchBirthday(req, { birthday: { day: 12, month: 11 } });
    const cleared = await env.birthday.patchBirthday(req, { birthday: null });

    expect(cleared.birthday).toBeNull();
    expect(env.profiles.store.get(PROFILE_1)?.birthday).toBeNull();
  });

  it('збереження не надсилає повідомлення (жодної події outbox)', async () => {
    env.events.length = 0;
    const req = reqOf(env.session);
    await env.birthday.patchBirthday(req, { birthday: { day: 1, month: 6 } });

    expect(env.events).toHaveLength(0);
  });

  it('неможливий день (31 лютого) — відмова', async () => {
    const req = reqOf(env.session);
    await expect(
      env.birthday.patchBirthday(req, { birthday: { day: 31, month: 2 } })
    ).rejects.toThrow('Invalid birthday: 31/2');
  });
});
