import type { ArticleProps } from './article';
import { normalizeSlug, normalizeTags } from './article-normalize';
import type { ArticleChanges } from './article-update';

function applyNullableField(
  props: ArticleProps,
  key: 'excerpt' | 'coverUrl' | 'authorName',
  value: string | null | undefined
): void {
  if (value !== undefined) props[key] = value?.trim() || null;
}

/** Застосовує часткові зміни до props агрегату (мутація на місці). */
export function applyArticleChanges(props: ArticleProps, changes: ArticleChanges, now: Date): void {
  if (changes.title !== undefined) props.title = changes.title.trim();
  if (changes.slug !== undefined) props.slug = normalizeSlug(changes.slug);
  applyNullableField(props, 'excerpt', changes.excerpt);
  if (changes.body !== undefined) props.body = changes.body;
  applyNullableField(props, 'coverUrl', changes.coverUrl);
  applyNullableField(props, 'authorName', changes.authorName);
  if (changes.tags !== undefined) props.tags = normalizeTags(changes.tags);
  props.updatedAt = now;
}
