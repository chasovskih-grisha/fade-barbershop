// Порти context content — контракти, які домен вимагає від інфраструктури.
// Напрям залежностей: infrastructure → application → domain.

import type { DomainEvent } from './article.events';
import type { Article } from './article';
import type { ArticleFeedQuery } from '../application/article-feed';
import type { SeoBlock } from './seo-block';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface Outbox {
  append(events: readonly DomainEvent[]): Promise<void>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export interface ArticleRepository {
  findById(id: string): Promise<Article | null>;
  findBySlug(slug: string): Promise<Article | null>;
  save(article: Article): Promise<void>;
  /** Адмінський список: чернетки й опубліковані, нові першими. */
  list(): Promise<Article[]>;
  /** Публічна стрічка: лише published, нові першими, з пошуком, тегом і курсором. */
  listPublished(query?: ArticleFeedQuery): Promise<Article[]>;
}

export interface SeoBlockRepository {
  findByEntity(entityType: string, entityId: string): Promise<SeoBlock | null>;
  save(seoBlock: SeoBlock): Promise<void>;
}
