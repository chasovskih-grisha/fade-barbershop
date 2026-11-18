'use client';

import { useEffect, useState } from 'react';
import { AlertBanner } from '@fade/ui';
import { useTranslations } from 'next-intl';

// Стан «немає мережі» (T-4513): браузер знає про офлайн, сервер — ні.
// Показуємо, що це тимчасово, і скидаємо банер, коли зв'язок повернувся,
// щоб гість не гадав, чому запис не проходить. Тексти — з каталогу `states` (T-4612b).

export function OfflineBanner() {
  const t = useTranslations('states');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="mx-auto w-full max-w-container px-4 pt-3">
      <AlertBanner tone="info" title={t('offlineTitle')} description={t('offlineDescription')} />
    </div>
  );
}
