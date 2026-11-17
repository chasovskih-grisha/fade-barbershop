// LocationsModule — збірка context locations: use cases зв'язуються з
// інфраструктурою (Prisma, годинник, ID, outbox). Транзакція = один use case.

import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { HealthModule } from '../../shared/health/health.module';
import { PrismaLocationRepository } from './prisma-location.repository';
import { PrismaLocationLogoRepository } from './prisma-location-logo.repository';
import { S3PublicMediaStorage } from '../../shared/media/s3-public-media-storage';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import { PrismaOutboxPublisher } from './prisma-locations-outbox';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { AdminLocationsController } from './admin-locations.controller';
import { AdminLocationsLifecycleController } from './admin-locations-lifecycle.controller';
import { PublicLocationsController } from './public-locations.controller';
import { NominatimGeocoder } from './nominatim-geocoder';
import { GoogleGeocoder } from './google-geocoder';
import { CachedRateLimitedGeocoder } from './cached-rate-limited.geocoder';
import { SettingsRoutingGeocoder } from './settings-routing.geocoder';
import { PrismaGeocoderSettings } from './prisma-geocoder-settings';
import { AdminGeocoderSettingsController } from './admin-geocoder-settings.controller';
import { AdminLocationsGeocodeController } from './admin-locations-geocode.controller';
import { NominatimGeocodeService } from './nominatim-geocode.service';
import { AdminLocationsLogoController } from './admin-locations-logo.controller';
import { GeocoderStoresFactory } from './geocoder-stores.factory';
import { locationUseCaseProviders } from './locations.providers';
import { locationHttpProviders } from './location-http.deps';
import { CACHED_ROUTING_GEOCODER } from './locations.geocoder-token';

export { CACHED_ROUTING_GEOCODER } from './locations.geocoder-token';

/** Обгортає сирий адаптер кешем + rate limit із фабричних сховищ. */
function wrappedGeocoder(
  deps: any[],
  adapter: string,
  inner: NominatimGeocoder | GoogleGeocoder
): CachedRateLimitedGeocoder {
  const stores = (deps[1] as GeocoderStoresFactory).forAdapter(adapter);
  return new CachedRateLimitedGeocoder({
    inner,
    cache: stores.cache,
    rateLimit: stores.rateLimit,
    tombstone: stores.tombstone,
    settings: () => (deps[0] as PrismaGeocoderSettings).get(),
  });
}

@Module({
  imports: [HealthModule],
  controllers: [
    AdminLocationsController,
    AdminLocationsLifecycleController,
    PublicLocationsController,
    AdminGeocoderSettingsController,
    AdminLocationsGeocodeController,
    AdminLocationsLogoController,
  ],
  providers: [
    PrismaService,
    PrismaUnitOfWork,
    PrismaLocationRepository,
    PrismaLocationLogoRepository,
    // Публічний бакет location-brand (T-4609a): логотипи — не персональні
    // дані (ADR 0015 не діє), тому URL публічні й кешуються.
    { provide: PUBLIC_MEDIA_STORAGE, useClass: S3PublicMediaStorage },
    PrismaOutboxPublisher,
    SystemClock,
    UuidIdGenerator,
    // GeocoderStoresFactory і GeocoderMetrics приходять з HealthModule (ADR 0050):
    // один інстанс на процес — декоратор і /health бачать ті самі лічильники.
    NominatimGeocoder,
    NominatimGeocodeService,
    GoogleGeocoder,
    PrismaGeocoderSettings,
    { provide: 'GEOCODER_NOMINATIM_RAW', useClass: NominatimGeocoder },
    { provide: 'GEOCODER_GOOGLE_RAW', useClass: GoogleGeocoder },
    {
      provide: CACHED_ROUTING_GEOCODER,
      useFactory: (...deps: any[]) =>
        new SettingsRoutingGeocoder({
          settings: deps[0] as PrismaGeocoderSettings,
          nominatim: wrappedGeocoder(deps, 'nominatim', deps[2] as NominatimGeocoder),
          google: wrappedGeocoder(deps, 'google', deps[3] as GoogleGeocoder),
          googleConfigured: () => (deps[3] as GoogleGeocoder).configured,
        }),
      inject: [
        PrismaGeocoderSettings,
        GeocoderStoresFactory,
        'GEOCODER_NOMINATIM_RAW',
        'GEOCODER_GOOGLE_RAW',
      ],
    },
    ...locationUseCaseProviders,
    ...locationHttpProviders,
  ],
  exports: [PrismaLocationRepository],
})
export class LocationsModule {}
