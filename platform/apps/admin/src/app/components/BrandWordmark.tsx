'use client';

import lockupUrl from '@fade/brand-assets/assets/lockup-on-dark.svg';

/** Повний словник бренду адмінки — використовується в широкому сайдбарі і
 *   хедері, щоб на `lg` і вище бренд не стиснувся до іконки.
 *
 *   Використовує lockup-on-dark.svg з @fade/brand-assets згідно з T-4609c та
 *   design-system.md §Типографіка.
 */
export function Wordmark(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props}>
      <img src={lockupUrl} alt="Логотип Fade" className="h-6 w-auto shrink-0" />
      <span className="truncate text-body text-fg leading-none font-semibold">· Admin</span>
    </span>
  );
}
