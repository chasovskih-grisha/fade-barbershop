// Sitemap (T-030, T-031): Next metadata-конвенція — GET /sitemap.xml віддає XML.
// Статичні сторінки + динамічні локації/послуги/барбери + опубліковані статті.
// Запити до API живуть у sitemap-entries.ts (fail-open для SEO).
import type { MetadataRoute } from 'next';
import {
  getArticleEntries,
  getBarberEntries,
  getLocationEntries,
  getServiceEntries,
} from './sitemap-entries';

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl;
  // prettier-ignore
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/locations`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/services`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/barbers`, changeFrequency: 'daily', priority: 0.8 },
  ];

  const [locationEntries, serviceEntries, barberEntries, articleEntries] = await Promise.all([
    getLocationEntries(base),
    getServiceEntries(base),
    getBarberEntries(base),
    getArticleEntries(base),
  ]);

  return [
    ...staticEntries,
    ...locationEntries,
    ...serviceEntries,
    ...barberEntries,
    ...articleEntries,
  ];
}
