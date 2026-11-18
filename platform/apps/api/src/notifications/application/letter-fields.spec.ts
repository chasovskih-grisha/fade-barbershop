import { formatWhen, httpUrl, toLetterRows, whereLine } from './letter-fields';

describe('letter fields', () => {
  it('форматує візит у Europe/Kyiv і мовчить на порожньому чи битому часі', () => {
    expect(formatWhen(undefined)).toBe('');
    expect(formatWhen('not-a-date')).toBe('');
    expect(formatWhen('2026-10-05T10:00:00.000Z')).toContain('5 жовтня 2026');
  });

  it('склеює місце лише з наявних частин', () => {
    expect(whereLine('FADE Podil', 'вул. Верхній Вал 28')).toBe('FADE Podil, вул. Верхній Вал 28');
    expect(whereLine(undefined, undefined)).toBe('');
    expect(whereLine('FADE Podil', undefined)).toBe('FADE Podil');
  });

  it('пускає в лист лише http(s) посилання', () => {
    expect(httpUrl(undefined)).toBe('');
    expect(httpUrl('not a url')).toBe('');
    expect(httpUrl('javascript:alert(1)')).toBe('');
    expect(httpUrl('http://example.com/a')).toBe('http://example.com/a');
    expect(httpUrl('https://fade.barbershop/book/123')).toBe('https://fade.barbershop/book/123');
  });

  it('перекладає рядки листа в поля шаблону', () => {
    expect(toLetterRows([['Коли', 'пʼятниця']])).toEqual([{ label: 'Коли', value: 'пʼятниця' }]);
  });
});
