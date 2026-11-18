// Ре-експорт єдиного визначення (клас живе в set-availability.ts, модуль
// реєструє саме його) — щоб токен DI збігався для всіх споживачів.
export { ListAvailabilityHandler } from './set-availability';
