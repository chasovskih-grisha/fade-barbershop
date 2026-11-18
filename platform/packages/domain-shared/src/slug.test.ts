import { slugify, validateSlug } from './slug';

describe('slug utility', () => {
  it('slugifies Ukrainian text with proper transliteration', () => {
    expect(slugify('Стрижка Бороди & Вуса')).toBe('stryzhka-borody-vusa');
    expect(slugify('Класичний чоловічий стиль')).toBe('klasychnyy-cholovichyy-styl');
    expect(slugify('  Капелюх / Шапка  ')).toBe('kapelyukh-shapka');
  });

  it('validates slug format', () => {
    expect(validateSlug('stryzhka-borody')).toBe(true);
    expect(validateSlug('haircut-1')).toBe(true);
    expect(validateSlug('Invalid_Slug')).toBe(false);
    expect(validateSlug('slug--double')).toBe(false);
    expect(validateSlug('-leading')).toBe(false);
  });
});
