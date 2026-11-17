// Set/DeleteLocationLogo — функціональні тести use cases логотипа локації
// (T-4609a): пара milk/dark, відккат невдалого завантаження, прибирання
// старих об'єктів, ідемпотентне видалення.
import { InvalidLocationInputError, LocationNotFoundError } from './locations-errors';
import { PNG, setupLocationLogo as setup } from './location-logo.spec-setup';

describe('SetLocationLogoHandler', () => {
  it('завантажує light+dark і зберігає ключі та variant', async () => {
    const { seed, logos, media, set } = await setup();
    const logo = await set.handle({
      locationId: 'loc-1',
      variant: 'lockup',
      alt: 'Логотип Fade Baumana',
      light: PNG,
      dark: PNG,
    });
    expect(logo.variant).toBe('lockup');
    expect(logo.lightKey).toMatch(/^locations\/loc-1\/.+\.webp$/);
    expect(logo.darkKey).toMatch(/-dark\.webp$/);
    expect(media.objects.size).toBe(2);
    expect(await logos.findByLocationId('loc-1')).toEqual(logo);
    expect(await seed.locations.findById('loc-1')).not.toBeNull();
  });

  it('невідома локація → 404-помилка, нічого не завантажено', async () => {
    const { media, set } = await setup();
    await expect(
      set.handle({ locationId: 'nope', variant: 'mark', alt: 'x', light: PNG })
    ).rejects.toBeInstanceOf(LocationNotFoundError);
    expect(media.objects.size).toBe(0);
  });

  it('невідомий формат → InvalidLocationInputError, без запису в БД', async () => {
    const { set } = await setup();
    await expect(
      set.handle({
        locationId: 'loc-1',
        variant: 'mark',
        alt: 'x',
        light: { bytes: PNG.bytes, contentType: 'image/gif' },
      })
    ).rejects.toBeInstanceOf(InvalidLocationInputError);
  });

  it('биті байти (MediaProcessingError) → 400 для клієнта', async () => {
    const { set } = await setup();
    await expect(
      set.handle({
        locationId: 'loc-1',
        variant: 'mark',
        alt: 'x',
        light: { bytes: new Uint8Array(), contentType: 'image/png' },
      })
    ).rejects.toBeInstanceOf(InvalidLocationInputError);
  });

  it('порожній alt → 400, завантажені обʼєкти прибрані', async () => {
    const { media, set } = await setup();
    await expect(
      set.handle({ locationId: 'loc-1', variant: 'mark', alt: '  ', light: PNG })
    ).rejects.toBeInstanceOf(InvalidLocationInputError);
    expect(media.objects.size).toBe(0);
  });

  it('заміна логотипа прибирає старі обʼєкти з бакета', async () => {
    const { media, set } = await setup();
    const first = await set.handle({ locationId: 'loc-1', variant: 'mark', alt: 'a', light: PNG });
    await set.handle({ locationId: 'loc-1', variant: 'mark', alt: 'b', light: PNG });
    expect(media.objects.has(first.lightKey)).toBe(false);
    expect(media.objects.size).toBe(1);
  });

  it('невдалий dark прибирає уже завантажений light', async () => {
    const { media, set } = await setup();
    await expect(
      set.handle({
        locationId: 'loc-1',
        variant: 'mark',
        alt: 'x',
        light: PNG,
        dark: { bytes: new Uint8Array(), contentType: 'image/png' },
      })
    ).rejects.toBeInstanceOf(InvalidLocationInputError);
    expect(media.objects.size).toBe(0);
  });
});

describe('DeleteLocationLogoHandler', () => {
  it('видаляє рядок і обʼєкти', async () => {
    const { logos, media, set, del } = await setup();
    await set.handle({ locationId: 'loc-1', variant: 'mark', alt: 'a', light: PNG, dark: PNG });
    await del.handle('loc-1');
    expect(await logos.findByLocationId('loc-1')).toBeNull();
    expect(media.objects.size).toBe(0);
  });

  it('ідемпотентно: без логотипа — тихий успіх', async () => {
    const { del } = await setup();
    await expect(del.handle('loc-1')).resolves.toBeUndefined();
    await expect(del.handle('nope')).resolves.toBeUndefined();
  });
});
