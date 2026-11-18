import { Article, normalizeSlug, normalizeTags } from './article';

// Агрегат Article: інваріанти чернетки, публікації та URL-ідентичності.
// Публічні API мусять бути стабільними — від них залежать SEO-URL статей.

describe('Article', () => {
  it('чернетка: публікації ще немає', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    expect(article.status).toBe('draft');
    expect(article.isPublished).toBe(false);
    expect(article.publishedAt).toBeNull();
  });

  it('slug нормалізується в URL-вигляд (кирилиця, пробіли, апострофи)', () => {
    expect(normalizeSlug('  Стрижка По-Київськи  ')).toBe('стрижка-по-київськи');
    expect(normalizeSlug("Fade's Style Guide")).toBe('fades-style-guide');
    expect(normalizeSlug('---')).toBe('');
  });

  it('публікація фіксує дату; повторна не змінює її (стрічка не стрибає)', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    const first = new Date('2026-09-21T10:00:00Z');
    article.publish(first);
    article.publish(new Date('2026-09-25T10:00:00Z'));
    expect(article.publishedAt).toEqual(first);
    expect(article.isPublished).toBe(true);
  });

  it('публікація без заголовка/тексту неможлива', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    article.update({ body: '   ' }, new Date('2026-09-20T09:00:00Z'));
    expect(() => article.publish(new Date('2026-09-21T10:00:00Z'))).toThrow(/body is required/i);
  });

  it('unpublish повертає у чернетку, зберігаючи дату публікації', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    article.publish(new Date('2026-09-21T10:00:00Z'));
    article.unpublish(new Date('2026-09-26T10:00:00Z'));
    expect(article.status).toBe('draft');
    expect(article.publishedAt).toEqual(new Date('2026-09-21T10:00:00Z'));
  });

  it('теги: унікальні, зневеличені, у стабільному порядку', () => {
    expect(normalizeTags(['Стиль', 'стиль', ' Поради ', ''])).toEqual(['поради', 'стиль']);
  });

  it('update не змінює поля, яких не передали, і оновлює updatedAt', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    article.update({ title: '  Стрижка по-київськи  ' }, new Date('2026-09-22T09:00:00Z'));
    expect(article.title).toBe('Стрижка по-київськи');
    expect(article.body).toBe('Текст');
    expect(article.updatedAt).toEqual(new Date('2026-09-22T09:00:00Z'));
  });

  it('snapshot не ділиться з агрегатом (мутація тегів не протікає назовні)', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: 'Текст',
      tags: ['стиль'],
      createdAt: new Date('2026-09-20T09:00:00Z'),
    });
    const snapshot = article.snapshot;
    snapshot.tags.push('підробка');
    expect(article.tags).toEqual(['стиль']);
  });
});
