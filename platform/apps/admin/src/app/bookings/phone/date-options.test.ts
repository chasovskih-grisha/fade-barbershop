// Юніт dateOptionsFrom (T-4409): чиста генерація дат — 14 днів, без вихідних.
// Саме фіксовані дати в e2e-тестах старіли і випадали з цього вікна, тож логіка
// винесена і зафіксована тестом від сталової базової дати.
import { dateOptionsFrom } from './date-options';

describe('dateOptionsFrom', () => {
  it('довідники не готові → порожній список', () => {
    expect(dateOptionsFrom('loading')).toEqual([]);
    expect(dateOptionsFrom('error')).toEqual([]);
  });

  it('14 днів уперед мінус вихідні; усі опції — робочі дні', () => {
    // Середа 2026-09-30 (полудень, щоб TZ не зсував дату): у вікні два вікенди
    // (сб/нд 10.03–10.04 і 10.10–10.11) → 14 − 4 = 10 робочих днів.
    const options = dateOptionsFrom('ready', new Date(2026, 8, 30, 12));
    expect(options).toHaveLength(10);
    for (const option of options) {
      const day = new Date(`${option.value}T12:00:00`).getDay();
      expect([0, 6]).not.toContain(day);
      expect(option.label).toMatch(/^пн|вт|ср|чт|пт/);
    }
  });

  it('перша опція — базова дата (середа → «ср 30.09»): підпис дня відповідає даті', () => {
    // Регресійний фікс: масив підписів був понеділковий при індексації getDay()
    // (недільний), тож день тижня в підписі був зсунутий на добу.
    const options = dateOptionsFrom('ready', new Date(2026, 8, 30, 12));
    expect(options[0]?.label).toBe('ср 30.09');
    expect(options[1]?.label).toBe('чт 01.10');
  });
});
