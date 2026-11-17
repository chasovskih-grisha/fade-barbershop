// T-4405: адмінський геокодер — парсинг Nominatim, кеш і м'яка деградація.

import { NominatimGeocodeService } from './nominatim-geocode.service';

class TestGeocoder extends NominatimGeocodeService {
  calls: string[] = [];
  responses: unknown[] = [];

  protected override now(): number {
    return 1_000;
  }

  protected override wait(): Promise<void> {
    return Promise.resolve();
  }

  protected override async getJson(url: string): Promise<unknown> {
    this.calls.push(url);
    return this.responses.shift() ?? null;
  }
}

describe('NominatimGeocodeService (T-4405)', () => {
  it('шукає адресу і мапить структуровані частини', async () => {
    const geocoder = new TestGeocoder();
    geocoder.responses.push([
      {
        display_name: 'Верхній Вал 28, Київ',
        lat: '50.4649',
        lon: '30.5171',
        address: {
          road: 'Верхній Вал',
          house_number: '28',
          city: 'Київ',
          postcode: '04071',
          country_code: 'ua',
        },
      },
    ]);

    const [hit] = await geocoder.search('Верхній Вал 28');
    expect(hit).toEqual({
      label: 'Верхній Вал 28, Київ',
      lat: 50.4649,
      lng: 30.5171,
      addressParts: {
        street: 'Верхній Вал',
        building: '28',
        city: 'Київ',
        postalCode: '04071',
        country: 'UA',
      },
    });
    expect(geocoder.calls[0]).toContain('search?');
    expect(geocoder.calls[0]).toContain('q=%D0%92%D0%B5%D1%80%D1%85%D0%BD%D1%96%D0%B9');
  });

  it('кешує повторний пошук і не робить зайвий запит', async () => {
    const geocoder = new TestGeocoder();
    geocoder.responses.push([]);
    await geocoder.search('Київ');
    await geocoder.search('  київ ');
    expect(geocoder.calls).toHaveLength(1);
  });

  it('короткий запит не йде в мережу', async () => {
    const geocoder = new TestGeocoder();
    expect(await geocoder.search('ab')).toEqual([]);
    expect(geocoder.calls).toHaveLength(0);
  });

  it('reverse повертає частини адреси і null на збої провайдера', async () => {
    const geocoder = new TestGeocoder();
    geocoder.responses.push({
      lat: '50.4501',
      lon: '30.5234',
      address: { road: 'Хрещатик', house_number: '1', town: 'Київ', country_code: 'ua' },
    });
    expect(await geocoder.reverse(50.4501, 30.5234)).toEqual({
      street: 'Хрещатик',
      building: '1',
      city: 'Київ',
      country: 'UA',
    });
    expect(await geocoder.reverse(50.1, 30.2)).toBeNull();
  });

  it('невалідні координати не доходять до провайдера', async () => {
    const geocoder = new TestGeocoder();
    expect(await geocoder.reverse(Number.NaN, 30)).toBeNull();
    expect(geocoder.calls).toHaveLength(0);
  });
});
