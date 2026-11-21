// Публічні статті блогу для /blog і /blog/{slug} (T-031, MNG-ADM-17). Типи —
// @fade/contracts. Сторінки кешуються (ISR): стаття опублікована — і має
// з'явитися в пошуку без чергової збірки сайту, але не миттєво (5 хв), тож
// невидима гість не бачить «напівготову» сторінку.

import type { Article, ArticleSummary } from '@fade/contracts';
import { loadItem, loadList } from './http';
import type { LoadableItem, LoadableList } from './loadable';

/** Свіжість стрічки блогу у секундах (T-4513: контент кешується, ціни — ні). */
export const BLOG_REVALIDATE_SEC = 300;

export interface ArticleFeedQuery {
  limit?: number;
  q?: string;
  tag?: string;
  cursor?: string;
}

export function getPublishedArticles(
  query: ArticleFeedQuery = {}
): Promise<LoadableList<ArticleSummary>> {
  const params = new URLSearchParams({ limit: String(query.limit ?? 20) });
  if (query.q) params.set('q', query.q);
  if (query.tag) params.set('tag', query.tag);
  if (query.cursor) params.set('cursor', query.cursor);
  return loadList<ArticleSummary>(`/content/articles?${params}`, BLOG_REVALIDATE_SEC);
}

export function getPublishedArticle(slug: string): Promise<LoadableItem<Article>> {
  return loadItem<Article>(`/content/articles/${encodeURIComponent(slug)}`, BLOG_REVALIDATE_SEC);
}
