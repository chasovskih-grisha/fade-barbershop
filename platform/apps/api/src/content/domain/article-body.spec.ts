import { parseArticleBody, InvalidArticleBodyError } from './article-body';

// Підмножина markdown (T-2300a): блоки для сайту й застосунку, не HTML.
// Правила безпеки — це помилка публікації, а не «тихо почищено».

describe('parseArticleBody', () => {
  it('збирає абзац, h2/h3, список, цитату й зображення з alt', () => {
    const body = [
      'Перший абзац статті.',
      '',
      '## Підзаголовок',
      '',
      '### Менший підзаголовок',
      '',
      '- Перший пункт',
      '- Другий пункт',
      '',
      '> Цитата автора',
      '',
      '![Фото майстра](/media/photo.jpg "Підпис")',
    ].join('\n');

    expect(parseArticleBody(body)).toEqual([
      { type: 'paragraph', text: 'Перший абзац статті.' },
      { type: 'heading', level: 2, text: 'Підзаголовок' },
      { type: 'heading', level: 3, text: 'Менший підзаголовок' },
      { type: 'list', items: ['Перший пункт', 'Другий пункт'] },
      { type: 'quote', text: 'Цитата автора' },
      { type: 'image', src: '/media/photo.jpg', alt: 'Фото майстра', caption: 'Підпис' },
    ]);
  });

  it('зливає сусідні рядки в один абзац і тримає порожній рядок роздільником', () => {
    expect(parseArticleBody('Рядок один\nРядок два\n\nНовий абзац')).toEqual([
      { type: 'paragraph', text: 'Рядок один Рядок два' },
      { type: 'paragraph', text: 'Новий абзац' },
    ]);
  });

  it('зображення без alt — помилка публікації', () => {
    expect(() => parseArticleBody('![](/media/photo.jpg)')).toThrow(InvalidArticleBodyError);
  });

  it('сирий HTML і h1 заборонені', () => {
    expect(() => parseArticleBody('<div>вставка</div>')).toThrow(/Сирий HTML/);
    expect(() => parseArticleBody('# Заголовок першого рівня')).toThrow(/рівня 2–3/);
  });

  it('дозволяє лише https:// і шляхи сайту в посиланнях', () => {
    expect(
      parseArticleBody('Дивіться [сторінку](/services) і [сайт](https://fade.com.ua)')
    ).toEqual([
      {
        type: 'paragraph',
        text: 'Дивіться [сторінку](/services) і [сайт](https://fade.com.ua)',
      },
    ]);
    expect(() => parseArticleBody('[клік](javascript:alert(1))')).toThrow(InvalidArticleBodyError);
    expect(() => parseArticleBody('![alt](http://insecure.example/x.jpg)')).toThrow(
      InvalidArticleBodyError
    );
  });

  it('порожнє тіло дає порожній список блоків', () => {
    expect(parseArticleBody('  \n\n  ')).toEqual([]);
  });
});
