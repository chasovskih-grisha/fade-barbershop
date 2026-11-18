// Динамічні записи sitemap (T-030): локації, послуги, барбери, статті.
// Помилка API — порожній список (fail-open для SEO), не виняток.
import type { MetadataRoute } from 'next';

// prettier-ignore
interface PublishedArticle { slug: string; publishedAt: string | null; }
// prettier-ignore
interface Location { id: string; code: string; }
// prettier-ignore
interface ActiveService { id: string; }
// prettier-ignore
interface BarberDto { slug: string; any?: boolean; }

export const revalidate = 300;

const apiBase = process.env.WEB_API_URL ?? 'http://localhost:13000';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase}${path}`, { next: { revalidate } });
    if (res.ok) return (await res.json()) as T;
  } catch {
    // fail-open
  }
  return null;
}

function entry(url: string, priority: number): MetadataRoute.Sitemap[number] {
  return { url, changeFrequency: 'weekly' as const, priority };
}

export async function getLocationEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const locations = await fetchJson<Location[]>('/locations');
  if (!locations) return [];
  return locations
    .filter((loc) => loc.code)
    .map((loc) => entry(`${base}/locations/${loc.code}`, 0.7));
}

export async function getServiceEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const services = await fetchJson<ActiveService[]>('/public/services/active');
  if (!services) return [];
  return services.filter((s) => s.id).map((s) => entry(`${base}/services/${s.id}`, 0.7));
}

export async function getBarberEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const locations = await fetchJson<Location[]>('/locations');
  const firstLocation = locations?.[0];
  if (!firstLocation?.id) return [];

  const barbers = await fetchJson<BarberDto[]>(
    `/booking/barbers/${encodeURIComponent(firstLocation.id)}`
  );
  if (!barbers) return [];
  return barbers
    .filter((b) => b.slug && !b.any)
    .map((barber) => entry(`${base}/barbers/${barber.slug}`, 0.7));
}

export async function getArticleEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const articles = await fetchJson<PublishedArticle[]>('/content/articles?limit=50');
  if (!articles) return [];

  return articles.map((a) => {
    const article: MetadataRoute.Sitemap[number] = {
      url: `${base}/blog/${a.slug}`,
      changeFrequency: 'daily',
      priority: 0.8,
    };
    if (a.publishedAt) article.lastModified = new Date(a.publishedAt);
    return article;
  });
}
