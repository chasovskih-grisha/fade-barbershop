// Перевірка денного ліміту під час запису (T-4421). Тримаємо окремо від
// use-case, щоб той лишався лінійним: ліміт — це ще одне правило доступу до
// слота, як перевірка перекриття.
import {
  exceedsDailyLoad,
  type DailyLoadPolicy,
  type DatedBooking,
} from '../domain/daily-load-limit';

export interface DailyLoadCheck {
  policy?: DailyLoadPolicy | undefined;
  barberId: string;
  start: Date;
  load: () => Promise<DatedBooking[]>;
}

/** Чи вже вичерпав барбер денний ліміт локації на дату візиту. */
export async function isOverDailyLimit(check: DailyLoadCheck): Promise<boolean> {
  const { policy, barberId, start, load } = check;
  if (!policy || policy.maxBookingsPerBarberPerDay === null) return false;
  return exceedsDailyLoad({ bookings: await load(), barberId, start, policy });
}
