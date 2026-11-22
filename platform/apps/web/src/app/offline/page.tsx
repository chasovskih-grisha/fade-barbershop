import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Немає з’єднання',
  description: 'Сторінка недоступна офлайн. Перевірте з’єднання та спробуйте ще раз.',
  robots: { index: false, follow: false },
};

/** Offline fallback served by the service worker for failed navigations (T-5027). */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6 md:py-16">
      <h1 className="font-display text-h4">Немає з’єднання</h1>
      <p className="text-fg-secondary">
        Схоже, ви офлайн. Перевірте інтернет і спробуйте відкрити сторінку ще раз — вільні вікна
        для запису підтягнуться автоматично.
      </p>
      <a className="text-accent underline" href="/booking">
        Перейти до запису
      </a>
    </main>
  );
}
