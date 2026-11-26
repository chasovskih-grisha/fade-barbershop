// Content: контракти блогу для клієнтів (web / mobile / admin).
// Джерело істини — /content/articles (публічно) та /admin/content/articles (CMS).

import type { Uuid } from './uuid';

export const CONTENT_EVENTS = {
  ARTICLE_DRAFTED: 'content.article.drafted',
  ARTICLE_PUBLISHED: 'content.article.published',
  ARTICLE_UNPUBLISHED: 'content.article.unpublished',
} as const;

export type ArticleStatus = 'draft' | 'published';

/** Один блок тіла статті: клієнт малює структуру, а не виконує HTML. */
export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string; caption: string | null };

/** Анонс для стрічки: без повного тексту. */
export interface ArticleSummary {
  id: Uuid;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
  publishedAt: string | null;
}

export interface Article extends ArticleSummary {
  body: string;
  /** Розібране тіло; порожній масив, якщо чернетка ще не готова до публікації. */
  blocks: ArticleBlock[];
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DraftArticleInput {
  title: string;
  slug: string;
  body: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  authorName?: string | null;
  tags?: string[];
}

export type UpdateArticleInput = Partial<DraftArticleInput>;

export interface ArticleRef {
  id: Uuid;
  slug: string;
}

export interface PublishArticleResult extends ArticleRef {
  publishedAt: string;
}

export interface ContentErrorBody {
  code: 'ARTICLE_NOT_FOUND' | 'ARTICLE_SLUG_TAKEN' | 'INVALID_ARTICLE_INPUT' | 'CONTENT_INTERNAL';
  message: string;
}
