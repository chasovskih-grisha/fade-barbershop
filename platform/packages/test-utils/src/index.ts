// @fade/test-utils — спільні e2e-фікстури платформи (phones, locations,
// bookings, FK-cleanup, HTTP retry). Споживається тільки тестовим кодом —
// у прод-код (apps/* src) не імпортувати.
export const TEST_UTILS_VERSION = '1.0.0';
export type { TestDb, TestDbDelegate } from './db-port';
export { testPhone } from './seed-phone';
export { seedTestLocation, type SeedLocationInput, type SeededLocation } from './seed-location';
export { cleanupTestLocation } from './cleanup-location';
export { seedBarberUser, assignBarber, seedRawBooking, walkInWindow } from './seed-booking';
export { seedServiceWithPrices, type ServicePriceInput } from './seed-service';
export { postWithRetry, patchWithRetry, getWithRetry } from './http-retry';
export { expectRejected, expectRejectsWith, expectSyncThrow } from './expect';
