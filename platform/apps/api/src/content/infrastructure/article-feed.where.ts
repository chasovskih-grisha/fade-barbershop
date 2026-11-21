// Умови публічної стрічки для Prisma (T-2300e). Винесені з репозиторію, щоб
// `listPublished` лишався читабельним, а пошук і курсор можна було перевірити
// окремо від запиту.

import type { Prisma } from '@prisma/client';
import { decodeCursor, feedQuery, type ArticleFeedQuery } from '../application/article-feed';

/** Чернетки відсікає сам запит, не фільтр у контролері. */
export function feedWhere(raw: ArticleFeedQuery): Prisma.ArticleWhereInput {
  const { tag, q, cursor } = feedQuery(raw);
  const after = decodeCursor(cursor);
  return {
    status: 'published',
    ...(tag ? { tags: { has: tag } } : {}),
    AND: [
      ...(q ? [{ OR: searchClauses(q) }] : []),
      ...(after ? [{ OR: cursorClauses(after) }] : []),
    ],
  };
}

/** `ILIKE` по заголовку, анонсу й тілу: обсяг блогу це витримує. */
export function searchClauses(q: string): Prisma.ArticleWhereInput[] {
  return ['title', 'excerpt', 'body'].map((field) => ({
    [field]: { contains: q, mode: 'insensitive' as const },
  }));
}

/** Строго після курсора: старіша дата, а на рівній — менший `id`. */
export function cursorClauses(after: {
  publishedAt: Date;
  id: string;
}): Prisma.ArticleWhereInput[] {
  return [
    { publishedAt: { lt: after.publishedAt } },
    { publishedAt: after.publishedAt, id: { lt: after.id } },
  ];
}
