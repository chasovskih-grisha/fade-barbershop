// Disable/EnableLocationHandler — вмикання/вимикання точки (MNG-ADM-02).

import { DisableLocationHandler, EnableLocationHandler } from './set-location-active';
import { passthroughUow } from './ports.fakes';
import { LocationNotFoundError } from './locations-errors';
import { seedLocation } from '../test-helpers.fakes';

type Seed = Awaited<ReturnType<typeof seedLocation>>;

function handlers(seed: Seed) {
  return {
    disable: new DisableLocationHandler({
      locations: seed.locations,
      outbox: seed.outbox,
      clock: seed.clock,
      uow: passthroughUow,
    }),
    enable: new EnableLocationHandler({
      locations: seed.locations,
      outbox: seed.outbox,
      clock: seed.clock,
      uow: passthroughUow,
    }),
  };
}

describe('Disable/EnableLocationHandler', () => {
  it('вимикає, потім вмикає з різними подіями; ідемпотентно', async () => {
    const seed = await seedLocation();
    const { disable, enable } = handlers(seed);
    await disable.handle('loc-1');
    expect((await seed.locations.findById('loc-1'))?.active).toBe(false);
    await disable.handle('loc-1');
    expect(seed.outbox.events.map((e) => e.type)).toEqual([
      'locations.location.opened',
      'locations.location.chair_added',
      'locations.location.chair_added',
      'locations.location.disabled',
    ]);

    await enable.handle('loc-1');
    expect((await seed.locations.findById('loc-1'))?.active).toBe(true);
    expect(seed.outbox.events.at(-1)?.type).toBe('locations.location.enabled');

    const before = seed.outbox.events.length;
    await enable.handle('loc-1');
    expect(seed.outbox.events.length).toBe(before);
  });

  it('неіснуюча локація — помилка', async () => {
    const seed = await seedLocation();
    const { disable, enable } = handlers(seed);
    await expect(disable.handle('nope')).rejects.toBeInstanceOf(LocationNotFoundError);
    await expect(enable.handle('nope')).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
