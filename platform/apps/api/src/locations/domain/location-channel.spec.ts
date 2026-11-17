// normalizeChannel(s) — валідація каналів зв'язку локації.

import { normalizeChannel, normalizeChannels, CHANNEL_LIMIT } from './location-channel';

describe('normalizeChannel', () => {
  it('телефон: нормалізує пробіли/дужки, валідний формат', () => {
    const ch = normalizeChannel('phone', '+380 (67) 123-45-67', 0);
    expect(ch.channel).toBe('phone');
    expect(ch.value).toBe('+380 (67) 123-45-67');
  });

  it('телефон: відхиляє літери', () => {
    expect(() => normalizeChannel('phone', 'abc-def', 0)).toThrow('Invalid phone');
  });

  it('email: відхиляє без домену', () => {
    expect(() => normalizeChannel('email', 'not-an-email', 0)).toThrow('Invalid email');
  });

  it('telegram: знімає собачку', () => {
    expect(normalizeChannel('telegram', '@fade_ua', 0).value).toBe('fade_ua');
  });

  it('telegram: відхиляє некоректний хендл', () => {
    expect(() => normalizeChannel('telegram', 'a b!', 0)).toThrow('Invalid handle');
  });

  it('facebook: приймає повний URL, зберігає лише шлях', () => {
    expect(normalizeChannel('facebook', 'https://www.facebook.com/fade.barbershop', 0).value).toBe(
      'fade.barbershop'
    );
  });

  it('website: лише http(s)', () => {
    expect(() => normalizeChannel('website', 'ftp://fade.com.ua', 0)).toThrow('http(s)');
  });

  it('невідомий тип каналу — помилка', () => {
    expect(() => normalizeChannel('smoke-signal', 'sos', 0)).toThrow('Unknown channel');
  });

  it('порожнє значення — помилка', () => {
    expect(() => normalizeChannel('phone', '   ', 0)).toThrow('1–200');
  });
});

describe('normalizeChannels', () => {
  it('sortOrder за замовчуванням = індекс', () => {
    const channels = normalizeChannels([
      { channel: 'phone', value: '+380671234567' },
      { channel: 'instagram', value: '@fade' },
    ]);
    expect(channels.map((c) => c.sortOrder)).toEqual([0, 1]);
  });

  it('дублікат типу — помилка', () => {
    expect(() =>
      normalizeChannels([
        { channel: 'phone', value: '+380671234567' },
        { channel: 'phone', value: '+380501234567' },
      ])
    ).toThrow('Duplicate channel: phone');
  });

  it('ліміт кількості каналів', () => {
    const many = Array.from({ length: CHANNEL_LIMIT + 1 }, (_, i) => ({
      channel: 'website',
      value: `https://site-${i}.com`,
    }));
    expect(() => normalizeChannels(many)).toThrow('At most');
  });
});
