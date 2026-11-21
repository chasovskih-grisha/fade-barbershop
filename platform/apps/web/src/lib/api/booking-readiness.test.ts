import { empty, failed, ok } from './loadable';
import { isBookingOpen } from './booking-readiness';

// T-4614e: запис закритий лише тоді, коли каталог підтверджено порожній.
// Збій API не має робити сайт «зачиненим» — інакше хвилинна помилка виглядає
// як закрита мережа.

describe('isBookingOpen', () => {
  it('тримає запис відкритим, коли локації є', () => {
    expect(isBookingOpen(ok([{ code: 'podil' }]))).toBe(true);
  });

  it('закриває запис, коли каталог підтверджено порожній', () => {
    expect(isBookingOpen(empty())).toBe(false);
  });

  it('не вважає збій API закриттям мережі', () => {
    expect(isBookingOpen(failed('API недоступний'))).toBe(true);
  });
});
