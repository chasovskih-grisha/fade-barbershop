// Сторінки стрічки блогу (T-2300e): 12 карток на сторінку, курсор API —
// пара `publishedAt|id`. Запит бере на одну статтю більше, щоб знати, чи є
// наступна, не додаючи до API нового поля. «Назад» не потребує зворотного
// курсора: адреса несе шлях зі стартів попередніх сторінок (`p`).

import type { ArticleSummary } from '@fade/contracts';
import type { LoadableList } from '@/lib/api/loadable';

export const BLOG_PAGE_SIZE = 12;

export type SearchParamValue = string | string[] | undefined;

export interface FeedPage {
  items: ArticleSummary[];
  nextHref: string | null;
  prevHref: string | null;
}

/** Курсор статті; без дати публікації курсора немає. */
export function articleCursor(article: ArticleSummary): string | null {
  return article.publishedAt ? `${article.publishedAt}|${article.id}` : null;
}

/** Шлях сторінок: останній курсор — початок поточної, попередні — історія. */
export function readTrail(raw: SearchParamValue): string[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values.map((value) => value.trim()).filter(Boolean);
}

export function feedHref(q: string, trail: string[]): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  for (const cursor of trail) params.append('p', cursor);
  const search = params.toString();
  return search ? `/blog?${search}` : '/blog';
}

/** Сторінка з відповіді API: помилка чи порожнеча дають порожній список карток. */
export function feedPage(
  articles: LoadableList<ArticleSummary>,
  q: string,
  trail: string[]
): FeedPage {
  return paginateFeed(articles.state === 'ok' ? articles.data : [], q, trail);
}

export function paginateFeed(rows: ArticleSummary[], q: string, trail: string[]): FeedPage {
  const items = rows.slice(0, BLOG_PAGE_SIZE);
  const last = items[items.length - 1];
  const next = rows.length > BLOG_PAGE_SIZE && last ? articleCursor(last) : null;
  return {
    items,
    nextHref: next ? feedHref(q, [...trail, next]) : null,
    prevHref: trail.length > 0 ? feedHref(q, trail.slice(0, -1)) : null,
  };
}
