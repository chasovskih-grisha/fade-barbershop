// Prisma-рядок Article → агрегат (окремо від репозиторію — гейт max-lines).

import { Article, type ArticleProps, type ArticleStatus } from '../domain/article';

export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function hydrateArticle(row: ArticleRow): Article {
  return Article.restore({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverUrl: row.coverUrl,
    authorName: row.authorName,
    tags: row.tags,
    status: row.status as ArticleStatus,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } satisfies ArticleProps);
}
