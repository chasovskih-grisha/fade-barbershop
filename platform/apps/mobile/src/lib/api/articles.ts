import { apiBase } from './api-base';

// T-2300f: застосунок читає той самий публічний API блогу, що й сайт
// (products.md §3). Окремого сховища статей і другої CMS у мобільному немає.

export interface ArticleSummaryDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
  publishedAt: string | null;
}

export interface ArticleDto extends ArticleSummaryDto {
  body: string;
}

export type ArticleLoad =
  { state: 'ok'; article: ArticleDto } | { state: 'notFound' } | { state: 'error' };

/** Стрічка опублікованих статей; чернетки API не віддає. */
export async function fetchArticleFeed(limit = 20): Promise<ArticleSummaryDto[]> {
  const response = await fetch(`${apiBase()}/content/articles?limit=${limit}`);
  if (!response.ok) throw new Error(`article feed: ${response.status}`);
  return (await response.json()) as ArticleSummaryDto[];
}

/** Стаття за slug. Чернетка і чужий slug — стан «немає статті», не помилка. */
export async function fetchArticle(slug: string): Promise<ArticleLoad> {
  const response = await fetch(`${apiBase()}/content/articles/${encodeURIComponent(slug)}`);
  if (response.status === 404) return { state: 'notFound' };
  if (!response.ok) return { state: 'error' };
  return { state: 'ok', article: (await response.json()) as ArticleDto };
}
