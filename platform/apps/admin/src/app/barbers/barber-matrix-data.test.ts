// Каталог локації → матриця (T-4521): послуга без категорії не має тягнути
// `category: undefined` у тип із exactOptionalPropertyTypes, а в редакторі
// потрапляє під «Без категорії».
import { categoriesOf, toMatrixService, UNCATEGORIZED } from './barber-matrix-categories';

describe('barber-matrix-data (T-4521)', () => {
  it('лишає category відсутньою, коли каталог її не дав', () => {
    const service = toMatrixService({ id: 'svc-1', name: 'Стрижка' });

    expect(service).toEqual({ id: 'svc-1', name: 'Стрижка' });
    expect('category' in service).toBe(false);
  });

  it('зберігає категорію і групує послуги без неї під «Без категорії»', () => {
    const services = [
      toMatrixService({ id: 'svc-1', name: 'Стрижка', category: 'Волосся' }),
      toMatrixService({ id: 'svc-2', name: 'Гоління' }),
    ];

    expect(services[0]).toEqual({ id: 'svc-1', name: 'Стрижка', category: 'Волосся' });
    expect(categoriesOf(services)).toEqual([
      { name: UNCATEGORIZED, serviceIds: ['svc-2'] },
      { name: 'Волосся', serviceIds: ['svc-1'] },
    ]);
  });

  it('не тягне зайвих полів каталогу в рядок матриці', () => {
    const catalogEntry = {
      id: 'svc-9',
      name: 'Камуфляж сивини',
      category: 'Фарбування',
      active: false,
      prices: [{ locationId: 'loc-1', active: false }],
    };

    const service = toMatrixService(catalogEntry);

    expect(service).toEqual({ id: 'svc-9', name: 'Камуфляж сивини', category: 'Фарбування' });
  });
});
