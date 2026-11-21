// Параметри публічної стрічки (T-2300e): пошук, тег, курсор. Нормалізація й
// порівняння живуть тут, щоб in-memory репозиторій у тестах і Prisma-запит
// відповідали на ті самі питання однаково.

import type { Article } from '../domain/article';

export const FEED_LIMIT = 20;
export const FEED_PAGE_MAX = 50;

export interface ArticleFeedQuery {
  /** Точний збіг із нормалізованим тегом. */
  tag?: string | undefined;
  /** Пошук у заголовку, анонсі й тілі; порожній — уся стрічка. */
  q?: string | undefined;
  /** Пара `publishedAt` + `id`: сторінка не губить статтю з тією ж датою. */
  cursor?: string | undefined;
  limit?: number | undefined;
}

export function normalizeTerm(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function clampLimit(limit: number | undefined): number {
  return limit && limit > 0 ? Math.min(limit, FEED_PAGE_MAX) : FEED_LIMIT;
}

export function feedQuery(raw: ArticleFeedQuery): ArticleFeedQuery {
  const tag = normalizeTerm(raw.tag);
  const q = normalizeTerm(raw.q);
  return {
    tag: tag || undefined,
    q: q || undefined,
    cursor: raw.cursor?.trim() || undefined,
    limit: clampLimit(raw.limit),
  };
}

export function encodeCursor(article: Article): string {
  const published = article.publishedAt?.toISOString() ?? '';
  return `${published}|${article.id}`;
}

export function decodeCursor(cursor: string | undefined): { publishedAt: Date; id: string } | null {
  const [iso, id] = (cursor ?? '').split('|');
  if (!iso || !id) return null;
  const publishedAt = new Date(iso);
  return Number.isNaN(publishedAt.getTime()) ? null : { publishedAt, id };
}

export function matchesSearch(article: Article, q: string | undefined): boolean {
  if (!q) return true;
  return [article.title, article.excerpt ?? '', article.body].some((field) =>
    field.toLowerCase().includes(q)
  );
}

export function matchesTag(article: Article, tag: string | undefined): boolean {
  if (!tag) return true;
  return article.tags.some((own) => normalizeTerm(own) === tag);
}

/** Новіші спершу; рівні дати розводить `id`, інакше межа сторінок плаває. */
export function newestFirst(a: Article, b: Article): number {
  const diff = (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
  return diff !== 0 ? diff : b.id.localeCompare(a.id);
}

/** Строго після курсора в порядку `newestFirst`: та сама дата → менший `id`. */
export function isAfterCursor(article: Article, cursor: string | undefined): boolean {
  const decoded = decodeCursor(cursor);
  if (!decoded) return true;
  const time = article.publishedAt?.getTime() ?? 0;
  const cursorTime = decoded.publishedAt.getTime();
  return time !== cursorTime ? time < cursorTime : article.id < decoded.id;
}
