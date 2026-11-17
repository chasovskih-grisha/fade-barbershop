// Юніт-тест правил логотипа локації (T-4609a): пара milk/dark, alt, варіант.
import { buildLocationLogo, InvalidLocationLogoError } from './location-logo';

const NOW = new Date('2026-10-16T00:00:00Z');
const base = {
  locationId: 'l1',
  variant: 'mark',
  lightKey: 'locations/l1/a-light.webp',
  darkKey: null as string | null,
  alt: 'Логотип Fade Podil',
  updatedAt: NOW,
};

describe('buildLocationLogo', () => {
  it('приймає light без dark і нормалізує alt', () => {
    const logo = buildLocationLogo({ ...base, alt: '  Логотип Fade Podil  ' });
    expect(logo).toEqual({ ...base, alt: 'Логотип Fade Podil', variant: 'mark' });
  });

  it('приймає пару light + dark (lockup)', () => {
    const logo = buildLocationLogo({
      ...base,
      variant: 'lockup',
      darkKey: 'locations/l1/a-dark.webp',
    });
    expect(logo.variant).toBe('lockup');
    expect(logo.darkKey).toBe('locations/l1/a-dark.webp');
  });

  it('dark без light → помилка (on-dark без on-milk непридатний)', () => {
    expect(() => buildLocationLogo({ ...base, lightKey: '', darkKey: 'x-dark.webp' })).toThrow(
      InvalidLocationLogoError
    );
    expect(() => buildLocationLogo({ ...base, lightKey: '', darkKey: 'x-dark.webp' })).toThrow(
      /without the light one/
    );
  });

  it('порожній light і порожній alt → помилка', () => {
    expect(() => buildLocationLogo({ ...base, lightKey: '' })).toThrow(InvalidLocationLogoError);
    expect(() => buildLocationLogo({ ...base, alt: '   ' })).toThrow(/Alt text is required/);
  });

  it('невідомий варіант і надто довгий alt → помилка', () => {
    expect(() => buildLocationLogo({ ...base, variant: 'logo' })).toThrow(/Unknown logo variant/);
    expect(() => buildLocationLogo({ ...base, alt: 'x'.repeat(121) })).toThrow(/≤ 120/);
  });
});
