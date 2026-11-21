import {
  bookAgainHref,
  bookAgainNotice,
  readBookAgainParams,
  staleFields,
  type BookAgainIntent,
} from '../book-again';

const ref = (id: string, stale = false) => ({ id, name: id, stale });

const intent = (over: Partial<BookAgainIntent> = {}): BookAgainIntent => ({
  location: ref('loc-1'),
  service: ref('svc-1'),
  barber: ref('bar-1'),
  price: 700,
  ...over,
});

describe('book-again (T-4617b)', () => {
  it('builds a link with all valid fields in a stable order', () => {
    expect(bookAgainHref(intent())).toBe('/booking?location=loc-1&service=svc-1&barber=bar-1');
  });

  it('omits a stale field so the flow opens on that choice step', () => {
    expect(bookAgainHref(intent({ barber: ref('bar-1', true) }))).toBe(
      '/booking?location=loc-1&service=svc-1'
    );
  });

  it('omits a missing service and links to the bare flow when nothing is valid', () => {
    expect(bookAgainHref(intent({ service: null }))).toBe('/booking?location=loc-1&barber=bar-1');
    expect(
      bookAgainHref({
        location: ref('loc-1', true),
        service: ref('svc-1', true),
        barber: ref('bar-1', true),
        price: null,
      })
    ).toBe('/booking');
  });

  it('lists only the invalid fields', () => {
    expect(staleFields(intent())).toEqual([]);
    expect(
      staleFields(intent({ service: ref('svc-1', true), barber: ref('bar-1', true) }))
    ).toEqual(['service', 'barber']);
    expect(staleFields(intent({ service: null }))).toEqual(['service']);
  });

  it('names what changed instead of an empty error', () => {
    expect(bookAgainNotice(intent())).toBeNull();
    expect(bookAgainNotice(intent({ barber: ref('bar-1', true) }))).toBe(
      'барбер більше не виконує цю послугу — оберіть заново'
    );
    expect(
      bookAgainNotice(intent({ service: ref('svc-1', true), barber: ref('bar-1', true) }))
    ).toBe('послуга більше не виконується, барбер більше не виконує цю послугу — оберіть заново');
  });

  it('reads prefill params and treats an empty value as absent', () => {
    expect(readBookAgainParams('?location=loc-1&service=svc-1&barber=bar-1')).toEqual({
      location: 'loc-1',
      service: 'svc-1',
      barber: 'bar-1',
    });
    expect(readBookAgainParams('?location=&barber=')).toEqual({
      location: null,
      service: null,
      barber: null,
    });
    expect(readBookAgainParams('')).toEqual({ location: null, service: null, barber: null });
  });
});
