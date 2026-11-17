// normalizePhoto(s) — валідація галереї локації.

import { normalizePhoto, normalizePhotos, PHOTOS_LIMIT } from './location-photo';

describe('normalizePhoto', () => {
  it('валідне фото: url + caption', () => {
    const photo = normalizePhoto('https://cdn.fade.com.ua/clt-01/1.jpg', 'Зал', 2);
    expect(photo).toEqual({
      url: 'https://cdn.fade.com.ua/clt-01/1.jpg',
      caption: 'Зал',
      sortOrder: 2,
    });
  });

  it('порожній caption → null', () => {
    expect(normalizePhoto('https://a.b/c.jpg', '   ', 0).caption).toBeNull();
  });

  it('не-http(s) URL — помилка', () => {
    expect(() => normalizePhoto('javascript:alert(1)', null, 0)).toThrow('http(s)');
  });

  it('надто довгий URL — помилка', () => {
    expect(() => normalizePhoto(`https://a.b/${'x'.repeat(600)}`, null, 0)).toThrow('500');
  });

  it('негативний sortOrder — помилка', () => {
    expect(() => normalizePhoto('https://a.b/c.jpg', null, -1)).toThrow('sortOrder');
  });
});

describe('normalizePhotos', () => {
  it('sortOrder за замовчуванням = індекс', () => {
    const photos = normalizePhotos([{ url: 'https://a.b/1.jpg' }, { url: 'https://a.b/2.jpg' }]);
    expect(photos.map((p) => p.sortOrder)).toEqual([0, 1]);
  });

  it('ліміт кількості фото', () => {
    const many = Array.from({ length: PHOTOS_LIMIT + 1 }, (_, i) => ({
      url: `https://a.b/${i}.jpg`,
    }));
    expect(() => normalizePhotos(many)).toThrow('At most');
  });
});
