// Середовище Playwright-спек адмінки. Усе перекривається env, щоб тест ходив на
// стенд, а не на локальні порти (те саме, що LOCATION_API_URL у apps/web).

export const ADMIN = {
  baseURL: process.env.ADMIN_BASE_URL ?? 'http://localhost:13002',
  username: process.env.ADMIN_USERNAME ?? 'owner',
  password: process.env.ADMIN_PASSWORD ?? 'FadeOwner2026',
} as const;

/** smspit/Mailpit: OTP приходить email-ом на <номер>@sms.dev (T-4301). */
export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:19096';

/**
 * Клієнт із сіду (`seed-customers`, DEFAULT_CUSTOMERS). Саме сід, а не свіжий
 * номер: `POST /admin/clients/otp/verify` відкидає невідомого користувача як
 * USER_NOT_FOUND, тож першого візиту новому номером цей флоу не закриває.
 */
export const SEED_CLIENT_PHONE = process.env.E2E_CLIENT_PHONE ?? '+380501112233';

/**
 * Барбер із сіду. Важливо саме за іменем, а не «перший у списку»: у спільній
 * dev-БД живуть барбери-фікстури-e2e без AvailabilityWindow, і POST
 * /admin/bookings відповідає їм 400 «no availability for this slot».
 */
export const SEED_BARBER_NAME = process.env.E2E_BARBER_NAME ?? 'Oleh';
