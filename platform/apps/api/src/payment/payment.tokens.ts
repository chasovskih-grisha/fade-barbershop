// Окремий модуль токенів: і модуль, і контролер інжектять той самий токен,
// не створюючи циклічний імпорт module ↔ controller.
export const BOOKING_PAYMENT_REPOSITORY = Symbol('BOOKING_PAYMENT_REPOSITORY');
