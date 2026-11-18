'use client';

import { AlertBanner } from '@fade/ui';
import { useTranslations } from 'next-intl';
import { RetryAction } from './RetryAction';

// Стан помилки даних на публічній сторінці (T-4513, ux-guidelines §1):
// сторінка лишається живою — заголовки, навігація й CTA працюють, а блок
// даних пояснює, що сталося, і дає повтор. Без retry помилка = мертва
// сторінка, з якої пішов гість. Retry — клієнтська кнопка (router.refresh),
// бо помилка сталася в SSR, де немає onClick. Додатково додано швидкий зв'язок із підтримкою.
// Тексти — з каталогу `states` (T-4612b).

export function ErrorState({ message }: { message: string }) {
  const t = useTranslations('states');
  return (
    <AlertBanner tone="error" title={t('errorTitle')} description={message}>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <RetryAction />
        <a
          href="https://t.me/fade_support_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-primary underline hover:text-action-primary transition-colors font-medium"
        >
          {t('supportLink')}
        </a>
      </div>
    </AlertBanner>
  );
}
