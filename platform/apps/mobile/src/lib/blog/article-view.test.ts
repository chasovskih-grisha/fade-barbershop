import { canonicalArticleUrl, formatArticleDate, splitParagraphs } from './article-view';

describe('article view (T-2300f)', () => {
  it('builds the canonical site URL, not an app deep link', () => {
    expect(canonicalArticleUrl('fade-cut')).toBe('https://fade.com.ua/blog/fade-cut');
  });

  it('splits the body into paragraphs without empty entries', () => {
    expect(splitParagraphs('Перший\n\n  Другий  \n\n\n')).toEqual(['Перший', 'Другий']);
  });

  it('hides the date when the article has none', () => {
    expect(formatArticleDate(null)).toBeNull();
  });

  it('formats a published date', () => {
    expect(formatArticleDate('2026-11-01T09:00:00.000Z')).toContain('2026');
  });
});
