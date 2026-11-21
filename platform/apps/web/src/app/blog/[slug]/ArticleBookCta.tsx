'use client';

import Link from 'next/link';
import { publicPageAnalytics } from '@/lib/analytics';

// Кнопка запису в кінці статті. Клік відрізняється від hero-кнопки:
// cta_location=article (T-2300h), щоб було видно, які есе ведуть у запис.
export function ArticleBookCta() {
  return (
    <Link
      href="/booking"
      onClick={() => publicPageAnalytics.ctaBookingClick('article')}
      className="inline-flex items-center justify-center rounded-input bg-accent px-6 py-3 text-body font-semibold text-accent-fg hover:opacity-95"
    >
      Записатися на стрижку
    </Link>
  );
}
