// T-4405: структурована адреса в агрегаті Location — create/update
// перераховують display-рядок через Address.formatted(), невалідні частини
// відхиляються доменом.

import { CreateLocationHandler } from './create-location';
import { UpdateLocationHandler } from './update-location';
import { InvalidLocationInputError } from './locations-errors';
import { FakeClock, FakeLocationRepository, FakeOutbox, SeqIds, passthroughUow } from './ports.fakes';
import { T0, baseInput, weekDays } from '../test-helpers.fakes';
import { hydrateLocation } from '../infrastructure/location-row';

const parts = {
  street: 'Верхній Вал',
  building: '28',
  city: 'Київ',
  postalCode: '04071',
  country: 'UA',
};

describe('Location structured address (T-4405)', () => {
  function setup() {
    const locations = new FakeLocationRepository();
    const outbox = new FakeOutbox();
    const create = new CreateLocationHandler({
      locations,
      outbox,
      clock: new FakeClock(T0),
      ids: new SeqIds(),
      uow: passthroughUow,
    });
    const update = new UpdateLocationHandler({
      locations,
      outbox,
      clock: new FakeClock(T0),
      uow: passthroughUow,
    });
    return { create, update, locations };
  }

  it('create з addressParts зберігає структуру і formatted() як display-рядок', async () => {
    const { create, locations } = setup();
    await create.handle({ ...baseInput(), address: 'ignored', addressParts: parts });
    const location = await locations.findById('loc-1');
    expect(location?.addressParts?.formatted()).toBe(
      'вул. Верхній Вал, 28, Київ, 04071, Україна'
    );
    expect(location?.address).toBe('вул. Верхній Вал, 28, Київ, 04071, Україна');
  });

  it('update перераховує display-рядок з нових частин', async () => {
    const { create, update, locations } = setup();
    await create.handle(baseInput());
    await update.handle({
      id: 'loc-1',
      addressParts: { street: 'Городоцька', building: '174', city: 'Львів' },
    });
    const location = await locations.findById('loc-1');
    expect(location?.address).toBe('вул. Городоцька, 174, Львів, Україна');
    expect(location?.addressParts?.city).toBe('Львів');
  });

  it('невалідні частини (порожня вулиця) → InvalidLocationInputError', async () => {
    const { create } = setup();
    await expect(
      create.handle({ ...baseInput(), addressParts: { ...parts, street: '  ' } })
    ).rejects.toBeInstanceOf(InvalidLocationInputError);
  });

  it('hydrate читає структуру з рядків БД і tolerate legacy без частин', () => {
    const row = {
      id: 'loc-1',
      code: 'CLT-01',
      name: 'Fade',
      address: 'стара адреса',
      street: 'Верхній Вал',
      building: '28',
      city: 'Київ',
      postalCode: null,
      country: 'UA',
      lat: 50.45,
      lng: 30.52,
      phone: null,
      email: null,
      active: true,
      createdAt: new Date(T0),
      chairs: [],
      hours: weekDays(),
      channels: [],
      photos: [],
    };
    expect(hydrateLocation(row).addressParts?.city).toBe('Київ');
    expect(hydrateLocation({ ...row, street: null }).addressParts).toBeNull();
  });
});
