import { Article } from '../domain/article';
import { toArticleDto } from './content.dto';

// Публічний DTO віддає блоки тіла, а не сирий markdown: клієнти малюють
// структуру (T-2300a). Чернетка з невалідним тілом лишається без блоків.

describe('toArticleDto', () => {
  const createdAt = new Date('2026-09-20T09:00:00Z');

  it('опублікована стаття: тіло розібране на блоки', () => {
    const article = Article.create({
      id: 'a1',
      slug: 'strizhka',
      title: 'Стрижка',
      body: '## Догляд\n\nМийте голову теплою водою.',
      createdAt,
    });

    const dto = toArticleDto(article);

    expect(dto.blocks).toEqual([
      { type: 'heading', level: 2, text: 'Догляд' },
      { type: 'paragraph', text: 'Мийте голову теплою водою.' },
    ]);
  });

  it('чернетка з сирим HTML: блоків немає, тіло лишається джерелом', () => {
    const article = Article.create({
      id: 'a2',
      slug: 'draft',
      title: 'Чернетка',
      body: '<script>alert(1)</script>',
      createdAt,
    });

    const dto = toArticleDto(article);

    expect(dto.blocks).toEqual([]);
    expect(dto.body).toBe('<script>alert(1)</script>');
  });
});
