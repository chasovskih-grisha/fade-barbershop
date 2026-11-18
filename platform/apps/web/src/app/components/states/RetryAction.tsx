'use client';

import { Button } from '@fade/ui';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Дія «Спробувати ще раз» для серверного стану помилки (T-4513): повторює
// запит сторінки на сервері (router.refresh()), бо помилка сталася в SSR,
// а не в браузері. Клієнтський компонент — onClick не може жити в RSC.

export function RetryAction({ label }: { label?: string }) {
  const router = useRouter();
  const t = useTranslations('states');
  return (
    <Button variant="secondary" size="md" onClick={() => router.refresh()}>
      {label ?? t('retry')}
    </Button>
  );
}
