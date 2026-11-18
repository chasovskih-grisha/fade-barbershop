// Фейки портів context content для функціональних тестів use cases
// (engineering-principles.md: «не мокати те, що має фейк порту»).

import { Article, type ArticleProps } from '../domain/article';
import type { DomainEvent } from '../domain/article.events';
import type { ArticleRepository, Clock, IdGenerator, Outbox, UnitOfWork } from '../domain/ports';

export class FakeClock implements Clock {
  constructor(private iso: string) {}
  now(): Date {
    return new Date(this.iso);
  }
  advance(ms: number): void {
    this.iso = new Date(new Date(this.iso).getTime() + ms).toISOString();
  }
}

export class SeqIds implements IdGenerator {
  private n = 0;
  id(): string {
    this.n += 1;
    return `art-${this.n}`;
  }
}

export class FakeOutbox implements Outbox {
  readonly events: DomainEvent[] = [];
  async append(events: readonly DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
  types(): string[] {
    return this.events.map((event) => event.type);
  }
}

export const passthroughUow: UnitOfWork = {
  run: async <T>(work: () => Promise<T>): Promise<T> => work(),
};

export class FakeArticleRepository implements ArticleRepository {
  private store = new Map<string, Article>();

  seed(...articles: Article[]): void {
    for (const a of articles) this.store.set(a.id, a);
  }

  async findById(id: string): Promise<Article | null> {
    return this.store.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    return [...this.store.values()].find((a) => a.slug === slug) ?? null;
  }

  async save(article: Article): Promise<void> {
    this.store.set(article.id, article);
  }

  async list(): Promise<Article[]> {
    return [...this.store.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listPublished(limit = 20): Promise<Article[]> {
    return (await this.list())
      .filter((a) => a.isPublished)
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, limit);
  }
}

export function articleFixture(overrides: Partial<ArticleProps> = {}): Article {
  return Article.restore({
    id: 'art-1',
    slug: 'strizhka-po-kyivsku',
    title: 'Стрижка по київськи',
    excerpt: 'Як виглядає стрижка по-київськи та кому вона підходить.',
    body: 'Текст статті.',
    coverUrl: null,
    authorName: 'Команда Fade',
    tags: ['стиль', 'поради'],
    status: 'draft',
    publishedAt: null,
    createdAt: new Date('2026-09-20T09:00:00Z'),
    updatedAt: new Date('2026-09-20T09:00:00Z'),
    ...overrides,
  });
}
