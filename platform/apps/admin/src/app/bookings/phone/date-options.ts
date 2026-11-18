// Опції дат для вибору слотів (T-4409): 14 днів уперед від базової дати,
// вихідні пропускаються — запис лише на робочі дні. Чиста функція без React:
// юніт-тест окремо (саме фіксовані дати в тестах старіли і випадали з вікна).
import type { RefsState } from './useVisitRefs';

export interface DateOption {
  value: string; // YYYY-MM-DD
  label: string; // «пн 05.10»
}

// Індекс = Date.getDay() (0 = неділя) — саме тому масив починається з «нд»;
// раніше він був понеділковий, тож підпис дня тижня був зсунутий на добу.
const dayLabels = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function dateOptionsFrom(refsState: RefsState, baseDate = new Date()): DateOption[] {
  if (refsState !== 'ready') return [];
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) return null;
    const value = date.toISOString().slice(0, 10);
    const label = `${dayLabels[date.getDay()]} ${date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
    })}`;
    return { value, label };
  }).filter(Boolean) as DateOption[];
}
