import { PreviewArticleHandler } from './preview-article';
import { InvalidArticleInputError } from './content-errors';

// Прев'ю (T-2300d) — це той самий парсер, що й публікація: якщо редактор бачить
// блоки в прев'ю, їх же збереже публікація. Незбережене тіло нікуди не пишеться.

const preview = new PreviewArticleHandler();

describe('PreviewArticleHandler', () => {
  it('віддає блоки того ж парсера, що й публікація', () => {
    const body = 'Перший абзац.\n\n![Фото](/media/a.jpg "Підпис")';

    expect(preview.handle({ body }).blocks).toEqual([
      { type: 'paragraph', text: 'Перший абзац.' },
      { type: 'image', src: '/media/a.jpg', alt: 'Фото', caption: 'Підпис' },
    ]);
  });

  it.each([
    ['<script>alert(1)</script>', /Сирий HTML у тексті заборонений/],
    ['![](/media/a.jpg)', /Зображення без alt публікувати заборонено/],
  ])('відхиляє тіло, яке публікація не прийме (%s)', (body, message) => {
    expect(() => preview.handle({ body })).toThrow(InvalidArticleInputError);
    expect(() => preview.handle({ body })).toThrow(message);
  });
});
