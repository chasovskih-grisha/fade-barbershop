import { DeleteLocationLogoHandler } from '../application/delete-location-logo';
import { SetLocationLogoHandler } from '../application/set-location-logo';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import { PrismaLocationLogoRepository } from './prisma-location-logo.repository';
import { PrismaLocationRepository } from './prisma-location.repository';
import { SystemClock } from './system-clock';

const setLogo = {
  provide: SetLocationLogoHandler,
  useFactory: (...deps: any[]) =>
    new SetLocationLogoHandler({
      locations: deps[0],
      logos: deps[1],
      media: deps[2],
      clock: deps[3],
    }),
  inject: [
    PrismaLocationRepository,
    PrismaLocationLogoRepository,
    PUBLIC_MEDIA_STORAGE,
    SystemClock,
  ],
};

const deleteLogo = {
  provide: DeleteLocationLogoHandler,
  useFactory: (...deps: any[]) => new DeleteLocationLogoHandler({ logos: deps[0], media: deps[1] }),
  inject: [PrismaLocationLogoRepository, PUBLIC_MEDIA_STORAGE],
};

export const locationLogoProviders = [setLogo, deleteLogo];
