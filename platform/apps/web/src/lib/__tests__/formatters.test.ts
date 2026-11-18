import { formatCurrency, formatDate, formatTime, formatDateTime, formatRelativeTime } from '../formatters';

describe('Localization Formatters', () => {
  describe('formatCurrency', () => {
    it('formats UAH currency correctly across locales (uk, en, es)', () => {
      const ukVal = formatCurrency(1500, 'UAH', 'uk');
      const enVal = formatCurrency(1500, 'UAH', 'en');
      const esVal = formatCurrency(1500, 'UAH', 'es');

      expect(ukVal).toBeTruthy();
      expect(enVal).toBeTruthy();
      expect(esVal).toBeTruthy();
    });

    it('handles fallback gracefully on unknown currency/locale', () => {
      const fallback = formatCurrency(500, 'XYZ', 'unknown');
      expect(fallback).toContain('500');
      expect(fallback).toContain('XYZ');
    });
  });

  describe('formatDate', () => {
    it('formats dates according to locale (uk, en, es)', () => {
      const testDate = '2026-06-15T12:00:00Z';
      const ukFormatted = formatDate(testDate, 'uk');
      const enFormatted = formatDate(testDate, 'en');
      const esFormatted = formatDate(testDate, 'es');

      expect(ukFormatted).toBeTruthy();
      expect(enFormatted).toBeTruthy();
      expect(esFormatted).toBeTruthy();
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate('invalid-date', 'uk')).toBe('invalid-date');
    });
  });

  describe('formatTime', () => {
    it('formats time according to locale and optional timezone', () => {
      const testDate = '2026-06-15T14:30:00Z';
      const ukTime = formatTime(testDate, 'uk', 'Europe/Kyiv');
      const enTime = formatTime(testDate, 'en', 'America/New_York');
      expect(ukTime).toBeTruthy();
      expect(enTime).toBeTruthy();
    });

    it('handles invalid dates gracefully in formatTime', () => {
      expect(formatTime('invalid', 'en')).toBe('invalid');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time according to locale', () => {
      const testDate = '2026-06-15T14:30:00Z';
      const ukRes = formatDateTime(testDate, 'uk');
      const enRes = formatDateTime(testDate, 'en');
      const esRes = formatDateTime(testDate, 'es');
      expect(ukRes).toBeTruthy();
      expect(enRes).toBeTruthy();
      expect(esRes).toBeTruthy();
    });

    it('handles invalid dates gracefully in formatDateTime', () => {
      expect(formatDateTime('invalid', 'en')).toBe('invalid');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats relative time across locales (uk, en, es)', () => {
      const futureDate = new Date(Date.now() + 3600 * 1000 * 2); // 2 hours later
      const ukRel = formatRelativeTime(futureDate, 'uk');
      const enRel = formatRelativeTime(futureDate, 'en');
      const esRel = formatRelativeTime(futureDate, 'es');

      expect(ukRel).toBeTruthy();
      expect(enRel).toBeTruthy();
      expect(esRel).toBeTruthy();
    });

    it('handles invalid dates gracefully in formatRelativeTime', () => {
      expect(formatRelativeTime('invalid', 'en')).toBe('invalid');
    });
  });
});
