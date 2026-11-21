// UpdateLocationHandler — канали звʼязку, галерея та ідемпотентність подій.

import { UpdateLocationHandler } from './update-location';
import { passthroughUow } from './ports.fakes';
import { seedLocation } from '../test-helpers.fakes';

type Seed = Awaited<ReturnType<typeof seedLocation>>;

function update(seed: Seed) {
  return new UpdateLocationHandler({
    locations: seed.locations,
    outbox: seed.outbox,
    clock: seed.clock,
    uow: passthroughUow,
  });
}

describe('UpdateLocationHandler channels/photos/events', () => {
  it('оновлює канали звʼязку та галерею з подіями', async () => {
    const seed = await seedLocation();
    const before = seed.outbox.events.length;
    await update(seed).handle({
      id: 'loc-1',
      channels: [
        { channel: 'phone', value: '+380501234567' },
        { channel: 'instagram', value: '@fade' },
      ],
      photos: [{ url: 'https://fade.com.ua/img/a.jpg', caption: 'Inside', sortOrder: 1 }],
    });
    const location = await seed.locations.findById('loc-1');
    expect(location?.channels?.map((c) => c.channel)).toEqual(['phone', 'instagram']);
    expect(location?.photos?.map((p) => p.url)).toEqual(['https://fade.com.ua/img/a.jpg']);
    expect(seed.outbox.events.slice(before).map((e) => e.type)).toEqual([
      'locations.location.channels_changed',
      'locations.location.photos_changed',
    ]);
  });

  it('однакові крісла/канали/фото не повторюють події', async () => {
    const seed = await seedLocation();
    const handler = update(seed);
    const chairs = [
      { number: 1, name: 'Крісло 1', active: true },
      { number: 2, name: null, active: false },
    ];
    await handler.handle({ id: 'loc-1', chairs });
    await handler.handle({ id: 'loc-1', chairs });
    await handler.handle({
      id: 'loc-1',
      channels: [{ channel: 'phone', value: '+380501234567' }],
      photos: [{ url: 'https://fade.com.ua/img/a.jpg' }],
    });
    const before = seed.outbox.events.length;
    await handler.handle({
      id: 'loc-1',
      channels: [{ channel: 'phone', value: '+380501234567' }],
      photos: [{ url: 'https://fade.com.ua/img/a.jpg' }],
    });
    expect(seed.outbox.events.length).toBe(before);
  });
});
