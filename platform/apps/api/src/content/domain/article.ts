// Article — публікація блогу (content, MNG-ADM-17). Агрегат: чернетка або
// опублікована стаття. Інваріанти: slug нормалізований і унікальний (перевіряє
// репозиторій — це єдине, що знає про інші статті), публікація неможлива без
// заголовка й тексту. Статус — словами домену (draft/published), не «setStatus».

import { parseArticleBody } from './article-body';
import { normalizeSlug, normalizeTags } from './article-normalize';
import { applyArticleChanges, type ArticleChanges } from './article-update';
import type { ArticleProps, ArticleStatus } from './article.types';

export type { ArticleStatus, ArticleProps } from './article.types';
export { normalizeSlug, normalizeTags } from './article-normalize';
export type { ArticleChanges } from './article-update';

export class Article {
  private constructor(private readonly props: ArticleProps) {}

  /** Чернетка з нормалізованим slug/taxonomy; restore повторно нормалізує (ідемпотентно). */
  // prettier-ignore
  static create(props: { id: string; slug: string; title: string; body: string; excerpt?: string | null; coverUrl?: string | null; authorName?: string | null; tags?: string[]; createdAt: Date }): Article {
    const now = props.createdAt;
    return Article.restore({
      id: props.id, slug: props.slug, title: props.title.trim(),
      excerpt: props.excerpt?.trim() || null, body: props.body,
      coverUrl: props.coverUrl?.trim() || null, authorName: props.authorName?.trim() || null,
      tags: normalizeTags(props.tags ?? []),
      status: 'draft', publishedAt: null, createdAt: now, updatedAt: now,
    });
  }

  static restore(props: ArticleProps): Article {
    return new Article({
      ...props,
      slug: normalizeSlug(props.slug),
      tags: normalizeTags(props.tags),
    });
  }

  // prettier-ignore
  get id(): string { return this.props.id; }
  // prettier-ignore
  get slug(): string { return this.props.slug; }
  // prettier-ignore
  get title(): string { return this.props.title; }
  // prettier-ignore
  get excerpt(): string | null { return this.props.excerpt; }
  // prettier-ignore
  get body(): string { return this.props.body; }
  // prettier-ignore
  get coverUrl(): string | null { return this.props.coverUrl; }
  // prettier-ignore
  get authorName(): string | null { return this.props.authorName; }
  // prettier-ignore
  get tags(): readonly string[] { return this.props.tags; }
  // prettier-ignore
  get status(): ArticleStatus { return this.props.status; }
  // prettier-ignore
  get publishedAt(): Date | null { return this.props.publishedAt; }
  // prettier-ignore
  get createdAt(): Date { return this.props.createdAt; }
  // prettier-ignore
  get updatedAt(): Date { return this.props.updatedAt; }
  get isPublished(): boolean {
    return this.props.status === 'published';
  }
  get snapshot(): ArticleProps {
    return { ...this.props, tags: [...this.props.tags] };
  }

  update(changes: ArticleChanges, now: Date): void {
    applyArticleChanges(this.props, changes, now);
  }

  /** Публікація: лише з готового тексту; повторна публікація лишає дату першої.
   * Тіло перевіряється підмножиною markdown (T-2300a) — сирий HTML і зображення
   * без alt не потрапляють на сайт. Повертає Effective-дату публікації. */
  publish(now: Date): Date {
    if (this.props.title.trim().length === 0)
      throw new Error('Article title is required to publish');
    if (this.props.body.trim().length === 0) throw new Error('Article body is required to publish');
    parseArticleBody(this.props.body);
    this.props.status = 'published';
    this.props.publishedAt = this.props.publishedAt ?? now;
    this.props.updatedAt = now;
    return this.props.publishedAt;
  }

  /** Зняття з публікації: стаття лишається в адмінці, але недоступна публічно. */
  unpublish(now: Date): void {
    this.props.status = 'draft';
    this.props.updatedAt = now;
  }
}
