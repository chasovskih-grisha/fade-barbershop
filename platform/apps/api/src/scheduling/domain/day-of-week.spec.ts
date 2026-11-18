// Специфікація спільного Monday-first індекса: межі тижня і обидва входи
// (Date і рядок DTO). До цього правило дублювалось у 4 файлах — тест
// фіксує семантику в одному місці.
import { dayOfWeekFor, dayOfWeekIndex } from './day-of-week';

describe('day-of-week (Monday-first модель тижня)', () => {
  it('понеділок — 0, неділя — 6, субота — 5', () => {
    expect(dayOfWeekFor('2026-11-09')).toBe(0); // понеділок
    expect(dayOfWeekFor('2026-11-14')).toBe(5); // субота
    expect(dayOfWeekFor('2026-11-15')).toBe(6); // неділя
  });

  it('Date-вхід збігається з ISO-входом того самого дня (UTC)', () => {
    for (const iso of ['2026-11-09', '2026-11-12', '2026-11-15']) {
      const day = new Date(`${iso}T00:00:00.000Z`);
      expect(dayOfWeekIndex(day)).toBe(dayOfWeekFor(iso));
    }
  });
});
