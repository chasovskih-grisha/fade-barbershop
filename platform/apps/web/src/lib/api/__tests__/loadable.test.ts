import { empty, failed, notFound, ok, okList } from '../loadable';

// Типи станів — це єдина гарантія T-4513: сторінка мусить відрізняти
// «порожньо» від «помилка» і від «знайдено», а не отримувати []/null.

describe('стани завантаження (Loadable)', () => {
  it('ok несе дані', () => {
    expect(ok([1, 2])).toEqual({ state: 'ok', data: [1, 2] });
  });

  it('empty/failed/notFound — окремі стани, а не порожні дані', () => {
    expect(empty()).toEqual({ state: 'empty' });
    expect(failed('Сервіс недоступний.')).toEqual({
      state: 'error',
      message: 'Сервіс недоступний.',
    });
    expect(notFound()).toEqual({ state: 'notFound' });
  });

  it('okList перетворює порожній масив на empty (інакше помилку видно як дані)', () => {
    expect(okList([])).toEqual({ state: 'empty' });
    expect(okList(['a'])).toEqual({ state: 'ok', data: ['a'] });
  });
});
