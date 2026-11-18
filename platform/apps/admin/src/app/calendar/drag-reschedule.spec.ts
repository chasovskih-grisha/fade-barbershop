import { canDrag, rescheduleWhen } from './drag-reschedule';
import { visit } from './visit-card.fixture';

describe('правила перетягування візиту (T-4524a)', () => {
  it('тягнути можна лише booked/confirmed', () => {
    expect(canDrag(visit({ status: 'booked' }))).toBe(true);
    expect(canDrag(visit({ status: 'confirmed' }))).toBe(true);
    for (const status of ['in_progress', 'completed', 'cancelled', 'no_show'])
      expect(canDrag(visit({ status }))).toBe(false);
  });

  it('дроп на слот дає ту саму команду переносу, що картка', () => {
    const when = rescheduleWhen(visit(), '14:30');
    expect(when).toEqual({ date: '2026-09-28', start: '14:30', end: '15:30' });
  });

  it('перенос зберігає тривалість візиту, а не довжину слота', () => {
    const short = visit({ start: '2026-09-28T10:00:00.000Z', end: '2026-09-28T10:45:00.000Z' });
    expect(rescheduleWhen(short, '09:15')).toEqual({
      date: '2026-09-28',
      start: '09:15',
      end: '10:00',
    });
  });

  it('невалідний час цілі — команди немає', () => {
    expect(rescheduleWhen(visit(), '25:00')).toBeNull();
    expect(rescheduleWhen(visit(), '')).toBeNull();
    expect(rescheduleWhen(visit(), '10:0')).toBeNull();
  });

  it('слот, що не вміщується в добу, не переносимо', () => {
    const long = visit({ start: '2026-09-28T10:00:00.000Z', end: '2026-09-28T12:00:00.000Z' });
    expect(rescheduleWhen(long, '23:30')).toBeNull();
    // 22:00 + 120 хв = 24:00 — «00:00» наступної доби не існує як кінець дня.
    expect(rescheduleWhen(long, '22:00')).toBeNull();
    expect(rescheduleWhen(long, '21:45')).toEqual({
      date: '2026-09-28',
      start: '21:45',
      end: '23:45',
    });
  });
});
