// Мокатори fetch-маршрутів для тестів телефонного запису (T-4409 UI / T-046).
// Виокремлено з phone-test-helpers.tsx, щоб кожен файл тримався під лімітом
// ADR 0019 (max-lines = 100).

// Client.id, який реально повертає POST /admin/clients/otp/verify (це User.id,
// а не ClientProfile.id — «Мої візити» читають записи саме за ним).
export const VERIFIED_CLIENT_ID = 'user-otp-verified';

// Типовий конфігураційний обʼєкт для телефонного запису: локації, барбери,
// слоти — використовується в тестах, що не хочуть кожен раз описувати референси.
export const PHONE_BOOKING_REFS = {
  locations: [
    { id: 'loc-1', name: 'Сіті Лейк', active: true },
    { id: 'loc-2', name: 'Стара Філія', active: false },
  ],
  barbers: [
    { id: 'barber-1', name: 'Іван', phone: '+380671110001', active: true },
    { id: 'barber-2', name: null, phone: '+380671110002', active: true },
    { id: 'barber-3', name: 'Петро', phone: '+380671110003', active: false },
  ],
} as const;

export const REFS = PHONE_BOOKING_REFS;

export const SLOTS = [
  { start: '10:00', end: '10:30', barbers: ['barber-1'] },
  { start: '10:30', end: '11:00', barbers: [] },
  { start: '11:00', end: '11:30', barbers: ['barber-1'] },
];

// Каталог /admin/services (T-4738): лише послуга з ціною в loc-1. Друга
// (loc-2) і неактивна потрібні, щоб довести, що список іде за локацією.
export const SERVICES = [
  {
    id: 'svc-1',
    name: 'Стрижка',
    duration: 45,
    active: true,
    prices: [{ locationId: 'loc-1', active: true }],
  },
  {
    id: 'svc-2',
    name: 'Борода',
    duration: 30,
    active: true,
    prices: [{ locationId: 'loc-2', active: true }],
  },
  {
    id: 'svc-3',
    name: 'Фарба',
    duration: 90,
    active: false,
    prices: [{ locationId: 'loc-1', active: true }],
  },
];

export function mockRoutesHandler(
  url: string,
  routes: Record<string, { status: number; body?: object }>
): object {
  const asResponse = (hit?: { status: number; body?: object }) =>
    hit
      ? { ok: hit.status < 400, status: hit.status, json: async () => hit.body ?? {} }
      : { ok: false, status: 500, json: async () => ({}) };
  // prettier-ignore
  if (url.endsWith('/admin/clients/otp/request')) return asResponse(routes['otp-request']);
  if (url.endsWith('/admin/clients/otp/verify')) {
    // Успішна верифікація завжди віддає clientId: без нього UI свідомо не
    // переходить до форми (щоб не створити візит без привʼязки). Підставляємо
    // типовий id, щоб тести не описували контракт щоразу.
    const hit = routes['otp-verify'];
    return hit && hit.status < 400
      ? {
          ok: true,
          status: hit.status,
          json: async () => ({
            phoneVerifiedAt: '2026-10-02T10:00:00.000Z',
            clientId: VERIFIED_CLIENT_ID,
            ...(hit.body ?? {}),
          }),
        }
      : asResponse(hit);
  }
  if (url.endsWith('/admin/bookings')) return asResponse(routes['booking']);
  if (url.endsWith('/admin/bookings/slots')) return asResponse(routes['slots']);
  if (url.endsWith('/admin/services')) return asResponse(routes['services']);
  if (url.endsWith('/admin/locations')) return asResponse(routes['locations']);
  if (url.endsWith('/admin/barbers')) return asResponse(routes['barbers']);
  throw new Error('unexpected fetch: ' + url);
}

export function mockOtpRoutes(routes: Record<string, { status: number; body?: object }>) {
  // prettier-ignore
  (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
    mockRoutesHandler(url, routes));
}

export function mockFullStack(routes: Record<string, { status: number; body?: object }>) {
  // prettier-ignore
  (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
    mockRoutesHandler(url, { ...routes, locations: { status: 200, body: REFS.locations }, barbers: { status: 200, body: REFS.barbers }, services: { status: 200, body: SERVICES }, slots: { status: 200, body: SLOTS } }));
}
