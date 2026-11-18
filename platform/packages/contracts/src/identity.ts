// Identity: відкриті контракти для клієнтів (web / mobile / admin).
// Схеми POST /identity/otp/request і /identity/otp/verify.

import type { Uuid } from './uuid';

export type OtpChannel = 'web' | 'mobile' | 'admin';

/** T-4422: пристрій/канал активної сесії клієнта. */
export type ClientSessionChannel = 'web' | 'mobile';

/** Спільні поля користувача в результатах сесійних ендпоінтів. */
export type SessionUser = { id: Uuid; phone: string };

/** Адмін (T-013) = користувач + username. */
export type AdminUser = SessionUser & { username: string };

/** T-4422: активна сесія клієнта (пристрій; поточна — за серверним Clock). */
export type ClientSession = {
  id: Uuid;
  channel: ClientSessionChannel;
  createdAt: string;
  current: boolean;
};

export const IDENTITY_EVENTS = {
  OTP_REQUESTED: 'identity.otp.requested',
  USER_REGISTERED: 'identity.user.registered',
  SESSION_STARTED: 'identity.session.started',
  SESSION_REVOKED: 'identity.session.revoked',
  SESSION_REFRESHED: 'identity.session.refreshed',
  /** T-4422: «вийти скрізь» — одна подія з кількістю закритих сесій. */
  SESSIONS_REVOKED_ALL: 'identity.sessions.revoked.all',
  /** T-4422: клієнт додав/змінив email (джерело сповіщень безпеки). */
  USER_EMAIL_CHANGED: 'identity.user.email.changed',
  /** T-4620a: клієнт змінив номер телефону. */
  USER_PHONE_CHANGED: 'identity.user.phone.changed',
} as const;

export type RequestOtpInput = { phone: string };

export type RequestOtpResult = { retryAfterSec: number };

export type RequestPhoneChangeOtpInput = { phone: string };

export type VerifyPhoneChangeInput = { phone: string; code: string };

export type VerifyPhoneChangeResult = { ok: true; phone: string };

export type VerifyOtpInput = { phone: string; code: string; channel?: OtpChannel };

export type VerifyOtpResult = {
  token: string;
  user: SessionUser;
  /** T-014: лише канал mobile — довгоживучий refresh (БД зберігає хеш). */
  refreshToken?: string;
};

export type IdentityErrorBody = { code: string; message: string; retryAfterSec?: number };

// Admin login (T-013): username + password, credentials stored in DB.
export type AdminLoginInput = { username: string; password: string };

export type AdminLoginResult = { token: string; user: AdminUser };

export type RevokeSessionInput = { token: string };

export type RevokeSessionResult = { ok: boolean };

// T-014: обмін валідного refresh на нову пару (ротація атомарна).
export type RefreshSessionInput = { refreshToken: string };

export type RefreshSessionResult = {
  token: string;
  refreshToken: string;
  expiresInSec: number;
  user: SessionUser;
};

// T-4422: список активних сесій клієнта (пристрої; поточна — за серверним Clock).
export type ListClientSessionsResult = { sessions: ClientSession[] };

// T-4422: «вийти скрізь» — інвалідація всіх активних сесій, окрім поточної.
export type RevokeAllSessionsResult = { revokedCount: number };

// T-4422: email для сповіщень безпеки (ADR 0005 — логін по телефону; email
// зберігає клієнт саме для сповіщень, у вхід не задіяний).
export type SetClientEmailInput = { email: string };

export type SetClientEmailResult = { ok: true; email: string };

// T-070/T-4422: push-токен пристрою (Expo) — канал сповіщень про новий вхід.
// Канал «дозволений» рівно тоді, коли пристрій зареєстрував токен: дозвіл
// видає ОС, тож окремого прапорця згоди не тримаємо.
export type PushPlatform = 'ios' | 'android' | 'web';

export type RegisterPushTokenInput = { token: string; platform?: PushPlatform };

export type RegisterPushTokenResult = { ok: true };

export type RevokePushTokenInput = { token: string };

export type RevokePushTokenResult = { ok: true; revoked: boolean };

// Клієнтський профіль (T-??): картка гостя з crm, доступна за сесією.
export type ClientProfileResult = {
  id: Uuid;
  userId: Uuid;
  name: string | null;
  phone: string;
  /** День і місяць народження без року (T-4730); порожнє — дефолт. */
  birthday: { day: number; month: number } | null;
  preferences: { id: Uuid; text: string; createdAt: string }[];
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PatchProfileNameInput = { name: string | null };

export type PatchProfileBirthdayInput = { birthday: { day: number; month: number } | null };

export type PatchProfilePreferencesInput = { preferences: string[] };

export type PatchProfilePreferencesResult = {
  preferences: { id: Uuid; text: string; createdAt: string }[];
};
