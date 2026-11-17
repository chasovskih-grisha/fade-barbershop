// UpdateLocationHandler — часткове оновлення профілю, годин і крісел
// (MNG-ADM-01/03/04); відсутні в input поля не змінюються.
import { UpdateLocationHandler } from './update-location';
import { passthroughUow } from './ports.fakes';
import { LocationNotFoundError, InvalidLocationInputError } from './locations-errors';
import { weekDays, seedLocation } from '../test-helpers.fakes';

type Seed = Awaited<ReturnType<typeof seedLocation>>;

function update(seed: Seed) {
  return new UpdateLocationHandler({
    locations: seed.locations,
    outbox: seed.outbox,
    clock: seed.clock,
    uow: passthroughUow,
  });
}

/** Свіжий сід + готовий хендлер. */
const setup = async () => {
  const seed = await seedLocation();
  return { seed, handler: update(seed) };
};

describe('UpdateLocationHandler', () => {
  it('оновлює профіль частково', async () => {
    const { seed, handler } = await setup();
    await handler.handle({ id: 'loc-1', name: 'Fade Podil', phone: '+380501234567' });
    const location = await seed.locations.findById('loc-1');
    expect(location?.name).toBe('Fade Podil');
    expect(location?.phone).toBe('+380501234567');
  });

  it('оновлює години та крісла з подіями', async () => {
    const { seed, handler } = await setup();
    await handler.handle({
      id: 'loc-1',
      hours: weekDays({ 6: { open: '10:00', close: '18:00' } }),
      chairs: [
        { number: 1, name: 'Крісло 1', active: true },
        { number: 2, name: null, active: false },
      ],
    });
    const location = await seed.locations.findById('loc-1');
    expect(location?.hours.days[6]?.open).toBe('10:00');
    expect(location?.chairs[1]?.active).toBe(false);
    // prettier-ignore
    expect(seed.outbox.events.map((e) => e.type)).toEqual(['locations.location.opened', 'locations.location.chair_added', 'locations.location.chair_added', 'locations.location.hours_changed', 'locations.location.chair_updated', 'locations.location.chair_updated']);
  });

  it('без змін не пише в репозиторій', async () => {
    const { seed, handler } = await setup();
    await handler.handle({ id: 'loc-1', name: 'Fade Baumana' });
    const before = seed.outbox.events.length;
    await handler.handle({ id: 'loc-1', name: 'Fade Baumana' });
    await handler.handle({ id: 'loc-1', active: true });
    expect(seed.outbox.events.length).toBe(before);
  });

  it('неіснуюча локація — помилка; невалідні координати — InvalidLocationInputError', async () => {
    const { handler } = await setup();
    await expect(handler.handle({ id: 'nope' })).rejects.toBeInstanceOf(LocationNotFoundError);
    // prettier-ignore
    await expect(handler.handle({ id: 'loc-1', lat: 200, lng: 10 })).rejects.toBeInstanceOf(InvalidLocationInputError);
  });

  it('оновлює координати і вимикає активність', async () => {
    const { seed, handler } = await setup();
    await handler.handle({ id: 'loc-1', lat: 50.45, lng: 30.52, active: false });
    const location = await seed.locations.findById('loc-1');
    expect(location?.lat).toBe(50.45);
    expect(location?.lng).toBe(30.52);
    expect(location?.active).toBe(false);
  });

  it('латка лише з lat не чіпає координати', async () => {
    const { seed, handler } = await setup();
    await handler.handle({ id: 'loc-1', lat: 50.45, lng: 30.52 });
    await handler.handle({ id: 'loc-1', lat: 50.44 });
    expect((await seed.locations.findById('loc-1'))?.lat).toBe(50.45);
  });

  it('відхиляє некоректні години та кількість крісел', async () => {
    const { seed, handler } = await setup();
    const hours = weekDays().map((d, i) => (i === 0 ? { ...d, open: '20:00', close: '09:00' } : d));
    // prettier-ignore
    await expect(handler.handle({ id: 'loc-1', hours })).rejects.toBeInstanceOf(InvalidLocationInputError);
    // prettier-ignore
    await expect(handler.handle({ id: 'loc-1', chairs: [{ number: 1, name: null, active: true }] })).rejects.toBeInstanceOf(InvalidLocationInputError);

    const before = seed.outbox.events.length;
    await handler.handle({ id: 'loc-1', hours: weekDays() });
    expect(seed.outbox.events.length).toBe(before);
  });
});
