'use client';

import { useAuth } from '@/app/components/auth/AuthProvider';
import { redirect } from 'next/navigation';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Навіть під час завантаження сесії не показуємо пусту сторінку барбера —
  // це розбіжність з адмінкою, де /admin/auth/me окремий ендпоінт.
  // Динамічний редирект тут — найпростіша збіжність із існуючим флоу клієнта.
  if (isLoading) {
    return null;
  }

  if (!user) {
    redirect('/login?next=/barber');
  }

  if (user.role !== 'barber') {
    // Барбер-сторінка — лише для ролі barber. Клієнт/адмін не мають сенсу
    // тут; redsirected на профіль, а не на адмінку (адмін має свій хост/шлях).
    redirect('/account');
  }

  return <>{children}</>;
}
