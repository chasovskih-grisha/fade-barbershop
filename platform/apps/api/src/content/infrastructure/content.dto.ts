// DTO контексту content. Один набір для публічного API й CMS: публічний клієнт
// отримує лише опубліковане, тож окремих публічних DTO не потрібно — різницю
// робить запит (ListPublishedArticlesHandler).

import type { ArticleBlock } from '@fade/contracts';

import type { Article } from '../domain/article';
import { InvalidArticleBodyError, parseArticleBody } from '../domain/article-body';

export interface ArticleDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  blocks: ArticleBlock[];
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

/** Чернетка може мати тіло, яке ще не проходить публікацію; тоді блоків немає. */
function articleBlocks(body: string): ArticleBlock[] {
  try {
    return parseArticleBody(body);
  } catch (error) {
    if (error instanceof InvalidArticleBodyError) return [];
    throw error;
  }
}

export function toArticleDto(article: Article): ArticleDto {
  return {
    ...toArticleSummary(article),
    body: article.body,
    blocks: articleBlocks(article.body),
    status: article.status,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}
