import type { Metadata } from 'next';

// Мета-шаблон SEO для сторінок (T-4508, web-screens §0: SSR + OG + канонічні URL).
// Канонічний хост — конфігурація, не літерал у коді (ADR 0017). Без NEXT_PUBLIC_SITE_URL
// канонічні URL не виставляються (dev), але title/OG працюють.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const DEFAULT_DESCRIPTION =
  'Fade — мережа барбершопів. Запис за 10 секунд, ціни й вільні вікна онлайн, роботи майстрів.';

export interface PageMetaInput {
  title: string;
  description?: string;
  /** Шлях без домену, наприклад '/locations'. */
  path?: string;
  image?: string;
  /** Сторінки кабінету/захищені — не індексувати. */
  noIndex?: boolean;
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  noIndex,
}: PageMetaInput): Metadata {
  const canonical = siteUrl ? `${siteUrl}${path}` : undefined;
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      siteName: 'Fade',
      title,
      description,
      locale: 'uk_UA',
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export { DEFAULT_DESCRIPTION };
