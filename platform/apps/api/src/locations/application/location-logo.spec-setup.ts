import { DeleteLocationLogoHandler } from './delete-location-logo';
import { SetLocationLogoHandler } from './set-location-logo';
import { FakeLocationLogoRepository } from './ports.fakes.extra';
import { seedLocation } from '../test-helpers.fakes';
import { MemPublicMediaStorage } from '../../shared/media/public-media-storage.fakes';

export const PNG = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };

export async function setupLocationLogo() {
  const seed = await seedLocation();
  const logos = new FakeLocationLogoRepository();
  const media = new MemPublicMediaStorage();
  const set = new SetLocationLogoHandler({
    locations: seed.locations,
    logos,
    media,
    clock: seed.clock,
  });
  const del = new DeleteLocationLogoHandler({ logos, media });
  return { seed, logos, media, set, del };
}
