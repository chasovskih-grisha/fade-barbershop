// Банер серії невдалих входів (T-4411 signals для власника адмінки):
// ≥STREAK_ALERT підряд — агресивний alert (ймовірний перебір пароля),
// коротша серія — полагідний status-банер. Серію рахує API (failedStreak).
import { AlertBanner } from '@fade/ui';

/** Поріг агресивного попередження: ≥3 підряд невдалих = ймовірний перебір. */
export const STREAK_ALERT = 3;

export default function StreakBanner({ streak }: { streak: number | null }) {
  if (streak === null || streak === 0) return null;
  if (streak >= STREAK_ALERT) {
    return (
      <AlertBanner
        tone="error"
        title={`Серія невдалих входів: ${streak} підряд`}
        description="Ймовірний перебір пароля. Перевірте, чи це ви намагались увійти; за потреби — скиньте пароль або заблокуйте обліковку."
      />
    );
  }
  return (
    <AlertBanner
      tone="info"
      title={`Останні ${streak} спроб входу невдалі`}
      description="Якщо це не ви — після кількох невдач підряд змініть пароль."
    />
  );
}
