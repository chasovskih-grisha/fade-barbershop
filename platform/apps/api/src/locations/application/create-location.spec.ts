import { CreateLocationHandler } from './create-location';
import { FakeClock, FakeLocationRepository, FakeOutbox, SeqIds, passthroughUow } from './ports.fakes';
import { LocationCodeTakenError, InvalidLocationInputError } from './locations-errors';
import { T0, baseInput } from '../test-helpers.fakes';

describe('CreateLocationHandler', () => {
  function setup() {
    const clock = new FakeClock(T0);
    const locations = new FakeLocationRepository();
    const outbox = new FakeOutbox();
    const ids = new SeqIds();
    const handler = new CreateLocationHandler({
      locations,
      outbox,
      clock,
      ids,
      uow: passthroughUow,
    });
    return { handler, locations, outbox };
  }

  it('створює локацію: великий код, 2 крісла, події Opened + ChairAdded', async () => {
    const { handler, locations, outbox } = setup();
    const result = await handler.handle(baseInput());
    expect(result.id).toBe('loc-1');
    const location = await locations.findById('loc-1');
    expect(location?.code).toBe('CLT-01');
    expect(location?.chairs).toHaveLength(2);
    const events = outbox.events.map((e) => e.type);
    expect(events).toEqual([
      'locations.location.opened',
      'locations.location.chair_added',
      'locations.location.chair_added',
    ]);
  });

  it('відхиляє дублікат коду', async () => {
    const { handler } = setup();
    await handler.handle(baseInput());
    await expect(handler.handle(baseInput())).rejects.toBeInstanceOf(LocationCodeTakenError);
  });

  it('відхиляє невалідний input як InvalidLocationInputError', async () => {
    const { handler } = setup();
    await expect(handler.handle(baseInput({ name: '' }))).rejects.toBeInstanceOf(
      InvalidLocationInputError
    );
    await expect(handler.handle(baseInput({ lat: 200 }))).rejects.toBeInstanceOf(
      InvalidLocationInputError
    );
  });
});
