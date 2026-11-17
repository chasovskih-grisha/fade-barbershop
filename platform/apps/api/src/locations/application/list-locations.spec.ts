// ListLocationsHandler — списки для адмінки і публічного API (вимкнені
// ховаються з сайту, §1.1 / web-screens §1–2).

import { ListLocationsHandler } from './list-locations';
import { DisableLocationHandler } from './set-location-active';
import { passthroughUow } from './ports.fakes';
import { LocationNotFoundError } from './locations-errors';
import { baseInput, seedLocation } from '../test-helpers.fakes';

describe('ListLocationsHandler', () => {
  it('list повертає все, listActive — лише активні', async () => {
    const seed = await seedLocation();
    await seed.create.handle({ ...baseInput(), code: 'clt-02', name: 'Fade Podil' });
    await new DisableLocationHandler({
      locations: seed.locations,
      outbox: seed.outbox,
      clock: seed.clock,
      uow: passthroughUow,
    }).handle('loc-2');
    const list = new ListLocationsHandler(seed.locations);
    expect((await list.list()).map((l) => l.code).sort()).toEqual(['CLT-01', 'CLT-02']);
    expect((await list.listActive()).map((l) => l.code)).toEqual(['CLT-01']);
    await expect(list.findById('nope')).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
