import { assertDraft, MAX_BODY, MAX_EXCERPT, MAX_TAGS, MAX_TITLE } from './article-input';
import { InvalidArticleInputError } from './content-errors';

// Межі чернетки (MNG-ADM-17 + products.md §1): текст без заголовка/тексту/URL не
// публікуємо, довгі поля обрізаємо помилкою, а не тихо. Ліміти — в одному місці.

const valid = { title: 'Стрижка', slug: 'strizhka', body: 'Текст статті' };

describe('assertDraft', () => {
  it('приймає коректну чернетку й нормалізує порожні поля в null', () => {
    expect(assertDraft({ ...valid, title: '  Стрижка  ' }, 'strizhka')).toEqual({
      title: '  Стрижка  ',
      slug: 'strizhka',
      body: 'Текст статті',
      excerpt: null,
      coverUrl: null,
      authorName: null,
      tags: [],
    });
  });

  it.each([
    [{ ...valid, title: '   ' }, 'slug', /Заголовок статті обов’язковий/],
    [{ ...valid, body: '  ' }, 'slug', /Текст статті обов’язковий/],
    [valid, '', /Slug статті обов’язковий/],
  ])('відкидає неповний ввід (%j)', (input, slug, message) => {
    expect(() => assertDraft(input, slug)).toThrow(message);
    expect(() => assertDraft(input, slug)).toThrow(InvalidArticleInputError);
  });

  it('обрізає довгі поля помилкою, а не мовчки', () => {
    expect(() => assertDraft({ ...valid, title: 'т'.repeat(MAX_TITLE + 1) }, 'slug')).toThrow(
      /Заголовок довший/
    );
    expect(() => assertDraft({ ...valid, body: 'т'.repeat(MAX_BODY + 1) }, 'slug')).toThrow(
      /Текст довший/
    );
    expect(() => assertDraft({ ...valid, excerpt: 'а'.repeat(MAX_EXCERPT + 1) }, 'slug')).toThrow(
      /Анонс довший/
    );
    expect(() =>
      assertDraft(
        { ...valid, tags: Array.from({ length: MAX_TAGS + 1 }, (_, i) => `t${i}`) },
        'slug'
      )
    ).toThrow(/Не більше/);
  });

  it('анонс із пробілів стає null, а не « порожністю »', () => {
    expect(assertDraft({ ...valid, excerpt: '   ' }, 'slug').excerpt).toBeNull();
  });
});
