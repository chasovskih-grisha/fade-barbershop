// DTO контексту content. Один набір для публічного API й CMS: публічний клієнт
// отримує лише опубліковане, тож окремих публічних DTO не потрібно — різницю
// робить запит (ListPublishedArticlesHandler).

import type { Article } from '../domain/article';

export interface ArticleDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Анонс для стрічки: без повного тексту (вага сторінки, SEO-ostaткі). */
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

export function toArticleSummary(article: Article): ArticleSummaryDto {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverUrl: article.coverUrl,
    authorName: article.authorName,
    tags: [...article.tags],
    publishedAt: article.publishedAt?.toISOString() ?? null,
  };
}

export function toArticleDto(article: Article): ArticleDto {
  return {
    ...toArticleSummary(article),
    body: article.body,
    status: article.status,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}
