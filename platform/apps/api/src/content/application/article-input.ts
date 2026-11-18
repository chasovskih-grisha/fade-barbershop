// Спільна валідація вводу статті: домен не знає, звідти прийшов title, тому
// правила «що можна опублікувати» живуть тут, а інваріанти агрегату — у ньому.

import { InvalidArticleInputError } from './content-errors';

export interface ArticleDraftInput {
  title: string;
  slug: string;
  body: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  authorName?: string | null;
  tags?: string[];
}

export const MAX_TITLE = 200;
export const MAX_BODY = 50_000;
export const MAX_EXCERPT = 500;
export const MAX_TAGS = 10;

export interface DraftValues {
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
}

function assertTitle(title: string): void {
  if (title.trim().length === 0)
    throw new InvalidArticleInputError('Заголовок статті обов’язковий');
  if (title.trim().length > MAX_TITLE)
    throw new InvalidArticleInputError(`Заголовок довший за ${MAX_TITLE} символів`);
}

function assertBody(body: string): void {
  if (body.trim().length === 0) throw new InvalidArticleInputError('Текст статті обов’язковий');
  if (body.length > MAX_BODY)
    throw new InvalidArticleInputError(`Текст довший за ${MAX_BODY} символів`);
}

function assertExcerpt(excerpt: string | null): void {
  if (excerpt && excerpt.length > MAX_EXCERPT)
    throw new InvalidArticleInputError(`Анонс довший за ${MAX_EXCERPT} символів`);
}

/** Перевіряє чернетку: заголовок і текст обов'язкові, slug — унікальний за URL. */
export function assertDraft(input: ArticleDraftInput, slug: string): DraftValues {
  assertTitle(input.title);
  assertBody(input.body);
  if (slug.length === 0) throw new InvalidArticleInputError('Slug статті обов’язковий');
  const excerpt = input.excerpt?.trim() || null;
  assertExcerpt(excerpt);
  if ((input.tags?.length ?? 0) > MAX_TAGS)
    throw new InvalidArticleInputError(`Не більше ${MAX_TAGS} тегів`);
  return {
    title: input.title,
    slug,
    body: input.body,
    excerpt,
    coverUrl: input.coverUrl ?? null,
    authorName: input.authorName ?? null,
    tags: input.tags ?? [],
  };
}
