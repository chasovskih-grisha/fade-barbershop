import {
  translate,
  formatCurrency,
  formatDate,
  formatTime,
  getLayoutDirection
} from '../src/index';

describe('FADE Internationalization & Localization (i18n)', () => {
  test('translates keys across supported locales (en, uk, es, fr, de, ar, he, it, pl)', () => {
    expect(translate('book_now', 'en')).toBe('Book Now');
    expect(translate('book_now', 'uk')).toBe('Забронювати');
    expect(translate('book_now', 'es')).toBe('Reservar Ahora');
    expect(translate('book_now', 'fr')).toBe('Réserver');
    expect(translate('book_now', 'de')).toBe('Jetzt Buchen');
    expect(translate('book_now', 'ar')).toBe('احجز الآن');
    expect(translate('book_now', 'he')).toBe('הזמן עכשיו');
    expect(translate('book_now', 'it')).toBe('Prenota Ora');
    expect(translate('book_now', 'pl')).toBe('Zarezerwuj Teraz');
    expect(translate('security_audit_passed', 'en')).toBe('Security and performance audit successfully passed');
    expect(translate('bundle_optimized', 'uk')).toBe('Розмір бандлу та доставку ресурсів оптимізовано');
    expect(translate('localization_specialist_active', 'es')).toBe('Especialista en localización autónoma inicializado con éxito');
    expect(translate('rtl_layout_verified', 'ar')).toBe('تم التحقق من متانة تخطيط RTL و LTR عبر جميع الإعدادات المحلية');
  });

  test('falls back to English or key when missing', () => {
    expect(translate('non_existent_key', 'uk')).toBe('non_existent_key');
  });

  test('formats currency correctly', () => {
    const usd = formatCurrency(50, 'USD', 'en');
    expect(usd).toContain('50');

    const uah = formatCurrency(1200, 'UAH', 'uk');
    expect(uah).toContain('1');

    const eur = formatCurrency(75, 'EUR', 'de');
    expect(eur).toContain('75');
  });

  test('formats date and time', () => {
    const d = new Date('2026-06-15T14:30:00Z');
    const formattedDate = formatDate(d, 'fr');
    expect(formattedDate).toBeTruthy();

    const formattedTime = formatTime(d, 'de');
    expect(formattedTime).toBeTruthy();
  });

  test('layout direction', () => {
    expect(getLayoutDirection('en')).toBe('ltr');
    expect(getLayoutDirection('uk')).toBe('ltr');
    expect(getLayoutDirection('es')).toBe('ltr');
    expect(getLayoutDirection('fr')).toBe('ltr');
    expect(getLayoutDirection('de')).toBe('ltr');
    expect(getLayoutDirection('ar')).toBe('rtl');
    expect(getLayoutDirection('he')).toBe('rtl');
  });
});
