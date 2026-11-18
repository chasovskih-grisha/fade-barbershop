import type { Article } from '@fade/contracts';

// Спільні дрібниці форм статті (admin CMS): теги з рядка та підпис статусу.
// Винесено, щоб форма створення й редактор не дублювали правила.

/** «Стиль, поради» → ['Стиль', 'поради']; порожні гілки — гнілими не стають. */
export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Статус статті текстом: редактор має зрозуміти, чи вона вже на сайті. */
export function statusLabel(article: Article): string {
  if (article.status !== 'published') return 'Чернетка';
  if (!article.publishedAt) return 'Опубліковано';
  return `Опубліковано ${new Date(article.publishedAt).toLocaleDateString('uk-UA')}`;
}

/** URL із заголовка: латиниця/кирилиця → дефіси, без апострофів. */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
