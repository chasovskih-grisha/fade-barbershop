import { Card } from '@fade/ui';

// Заглушки галереї (T-191) і відгуків (T-240) для сторінки майстра (T-4477a):
// чесний порожній стан без вигаданих робіт і без мертвих посилань. Рейтинг не
// показується до публічних відгуків (booking-flow.md:114).

export function BarberGalleryPlaceholder({ name }: { name: string }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <h3 className="font-display text-h4 font-semibold">Галерея робіт та портфоліо</h3>
      <p className="text-caption text-fg-secondary">
        Роботи майстра {name} з&apos;являться тут, щойно галерею буде підключено (T-191).
      </p>
    </Card>
  );
}

export function BarberReviewsPlaceholder() {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <h3 className="font-display text-h4 font-semibold">Відгуки клієнтів</h3>
      <p className="text-caption text-fg-secondary">
        Відгуків ще немає — вони з&apos;являться після публікації зібраних оцінок (T-240).
      </p>
    </Card>
  );
}
