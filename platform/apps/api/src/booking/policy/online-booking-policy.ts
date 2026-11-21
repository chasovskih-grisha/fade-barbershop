// Політика онлайн-букінгу (T-4542): конфіг на локацію з глобальним дефолтом.
// Домен не знає про Prisma — рядок БД перетворюється в політику тут, тож
// правила й повідомлення для фронту тестуються без живого Postgres.

export interface NoShowBlock {
  /** Скільки no-show блокує онлайн-запис. */
  count: number;
  /** Вікно, в якому рахуються no-show (днів). */
  windowDays: number;
}

export interface OnlineBookingPolicy {
  /** Не раніше ніж X хвилин від «зараз». */
  minLeadMinutes: number;
  /** Не далі ніж Y днів уперед. */
  maxHorizonDays: number;
  /** Онлайн-скасування — не пізніше Z годин до старту. */
  cancellationDeadlineHours: number;
  /** Онлайн-перенесення — не пізніше Z годин до старту. */
  rescheduleDeadlineHours: number;
  /** Максимум активних онлайн-записів у клієнта. */
  maxActiveBookings: number;
  /** Чи можна записатись без акаунта (лише телефон + OTP). */
  allowGuestBooking: boolean;
  noShowBlock: NoShowBlock;
}

export const DEFAULT_ONLINE_BOOKING_POLICY: OnlineBookingPolicy = {
  minLeadMinutes: 60,
  maxHorizonDays: 30,
  cancellationDeadlineHours: 12,
  rescheduleDeadlineHours: 12,
  maxActiveBookings: 2,
  allowGuestBooking: true,
  noShowBlock: { count: 3, windowDays: 180 },
};

/** Рядок БД (уже без null) або null → ефективна політика. */
export function mergePolicy(
  row: Partial<OnlineBookingPolicy> | null | undefined
): OnlineBookingPolicy {
  if (!row) return DEFAULT_ONLINE_BOOKING_POLICY;
  return {
    minLeadMinutes: row.minLeadMinutes ?? DEFAULT_ONLINE_BOOKING_POLICY.minLeadMinutes,
    maxHorizonDays: row.maxHorizonDays ?? DEFAULT_ONLINE_BOOKING_POLICY.maxHorizonDays,
    cancellationDeadlineHours:
      row.cancellationDeadlineHours ?? DEFAULT_ONLINE_BOOKING_POLICY.cancellationDeadlineHours,
    rescheduleDeadlineHours:
      row.rescheduleDeadlineHours ?? DEFAULT_ONLINE_BOOKING_POLICY.rescheduleDeadlineHours,
    maxActiveBookings: row.maxActiveBookings ?? DEFAULT_ONLINE_BOOKING_POLICY.maxActiveBookings,
    allowGuestBooking: row.allowGuestBooking ?? DEFAULT_ONLINE_BOOKING_POLICY.allowGuestBooking,
    noShowBlock: { ...DEFAULT_ONLINE_BOOKING_POLICY.noShowBlock, ...(row.noShowBlock ?? {}) },
  };
}

/** Мінімальні/максимальні межі конфігу — захист від «0 хвилин» і «0 днів». */
export function isValidPolicy(policy: OnlineBookingPolicy): boolean {
  return (
    policy.minLeadMinutes >= 0 &&
    policy.maxHorizonDays >= 1 &&
    policy.cancellationDeadlineHours >= 0 &&
    policy.rescheduleDeadlineHours >= 0 &&
    policy.maxActiveBookings >= 1 &&
    policy.noShowBlock.count >= 0 &&
    policy.noShowBlock.windowDays >= 1
  );
}
