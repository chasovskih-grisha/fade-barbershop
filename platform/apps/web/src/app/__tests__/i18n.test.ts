import { IntlMessageFormat } from 'intl-messageformat';
import bookingMessagesUk from '../../../messages/uk/booking.json';
import bookingMessagesEs from '../../../messages/es/booking.json';
import bookingMessagesEn from '../../../messages/en/booking.json';
import commonUk from '../../../messages/uk/common.json';

describe('i18n ICU pluralization and localization enhancement (FADE I18n Specialist)', () => {
  it('correctly formats Ukrainian plural forms for 1, 2, and 5 visits', () => {
    const template = bookingMessagesUk.visits;

    const formatter1 = new IntlMessageFormat(template, 'uk');
    expect(formatter1.format({ count: 1 })).toBe('1 візит');

    const formatter2 = new IntlMessageFormat(template, 'uk');
    expect(formatter2.format({ count: 2 })).toBe('2 візити');

    const formatter5 = new IntlMessageFormat(template, 'uk');
    expect(formatter5.format({ count: 5 })).toBe('5 візитів');
  });

  it('correctly formats Spanish plural forms for 1 and multiple visits', () => {
    const template = bookingMessagesEs.visits;

    const formatter1 = new IntlMessageFormat(template, 'es');
    expect(formatter1.format({ count: 1 })).toBe('1 visita');

    const formatter2 = new IntlMessageFormat(template, 'es');
    expect(formatter2.format({ count: 3 })).toBe('3 visitas');
  });

  it('correctly formats English plural forms for 1 and multiple visits', () => {
    const template = bookingMessagesEn.visits;

    const formatter1 = new IntlMessageFormat(template, 'en');
    expect(formatter1.format({ count: 1 })).toBe('1 visit');

    const formatter2 = new IntlMessageFormat(template, 'en');
    expect(formatter2.format({ count: 4 })).toBe('4 visits');
  });

  it('validates common accessibility and welcome keys across locales', () => {
    expect(commonUk.accessibility).toBe('Спеціальні можливості');
    expect(bookingMessagesUk.title).toBe('Онлайн-запис');
    expect(bookingMessagesEs.title).toBe('Reserva Online');
    expect(bookingMessagesEn.title).toBe('Online Booking');
  });
});
