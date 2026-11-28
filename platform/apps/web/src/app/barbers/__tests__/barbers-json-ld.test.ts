// T-4851: структуровані дані картки кажуть лише те, що знає запис майстра.
import { barbersJsonLd } from '../barbers-json-ld';

const SITE = 'https://fade.com.ua';

const barber = (overrides: Record<string, unknown> = {}) => ({
  name: 'Олександр Ковальчук',
  slug: 'oleksandr-kovalchuk',
  role: 'Барбер',
  photoUrl: null,
  ...overrides,
});

const items = (people: Array<Record<string, unknown>>) =>
  barbersJsonLd(people as never, SITE).itemListElement.map((entry) => entry.item);

test('a record with a role keeps that role as the job title', () => {
  expect(items([barber()])[0]).toMatchObject({ jobTitle: 'Барбер' });
});

test('a record without a role has no job title at all', () => {
  const person = items([barber({ role: null })])[0];

  expect(person).not.toHaveProperty('jobTitle');
  expect(JSON.stringify(person)).not.toContain('Майстер-барбер');
});

test('a blank role is not a role', () => {
  expect(items([barber({ role: '   ' })])[0]).not.toHaveProperty('jobTitle');
});

test('each card gets its own position and profile url', () => {
  const list = barbersJsonLd(
    [barber(), barber({ name: 'Ірина', slug: 'iryna', role: null })],
    SITE
  );

  expect(list['@type']).toBe('ItemList');
  expect(list.itemListElement.map((entry) => entry.position)).toEqual([1, 2]);
  expect(list.itemListElement.map((entry) => entry.item.url)).toEqual([
    `${SITE}/barbers/oleksandr-kovalchuk`,
    `${SITE}/barbers/iryna`,
  ]);
});
