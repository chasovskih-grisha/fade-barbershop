import {
  MAX_PREFERENCE_LINES,
  MAX_PREFERENCE_LINE_LENGTH,
  PREFERENCE_LIMIT_MESSAGE,
  isWithinPreferenceLimit,
  splitPreferenceLines,
} from './preferences';

describe('splitPreferenceLines (T-4721b)', () => {
  it('тримить рядки і відкидає порожні, як роут', () => {
    expect(splitPreferenceLines('  алергія  \n\n  тиша \n   ')).toEqual(['алергія', 'тиша']);
  });

  it('порожній текст дає порожній список (очищення дозволене)', () => {
    expect(splitPreferenceLines('')).toEqual([]);
  });
});

describe('isWithinPreferenceLimit (T-4721b)', () => {
  it('порожня нотатка валідна', () => {
    expect(isWithinPreferenceLimit([])).toBe(true);
  });

  it('рівно 20 рядків по 100 символів — межа включна', () => {
    const lines = Array.from({ length: MAX_PREFERENCE_LINES }, () =>
      'x'.repeat(MAX_PREFERENCE_LINE_LENGTH)
    );
    expect(isWithinPreferenceLimit(lines)).toBe(true);
  });

  it('21 рядок — поза лімітом', () => {
    const lines = Array.from({ length: MAX_PREFERENCE_LINES + 1 }, () => 'x');
    expect(isWithinPreferenceLimit(lines)).toBe(false);
  });

  it('рядок у 101 символ — поза лімітом', () => {
    expect(isWithinPreferenceLimit(['x'.repeat(MAX_PREFERENCE_LINE_LENGTH + 1)])).toBe(false);
  });

  it('порожні рядки не рахуються до 20', () => {
    const text = Array.from({ length: MAX_PREFERENCE_LINES }, () => 'x').join('\n') + '\n\n\n';
    expect(isWithinPreferenceLimit(splitPreferenceLines(text))).toBe(true);
  });

  it('відмова — українське речення', () => {
    expect(PREFERENCE_LIMIT_MESSAGE).toBe('Не більше 20 рядків, до 100 символів у рядку');
  });
});
