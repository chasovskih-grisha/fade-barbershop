// Допоміжний код e2e-сценаріїв «найближчі локації» (contract web-screens §1):
// in-memory репозиторій на рівні доменних агрегатів, стаб-геокодер за
// CITY_BOXES, збірка модульного графа Nest з оверрайдами портів.

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LocationsModule, CACHED_ROUTING_GEOCODER } from '../infrastructure/locations.module';
import { PrismaLocationRepository } from '../infrastructure/prisma-location.repository';
import { PrismaOutboxPublisher } from '../infrastructure/prisma-locations-outbox';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InMemoryLocationRepository, LVIV, OBOOLON, PODIL } from './nearest-locations.e2e.fixtures';

export { PODIL, OBOOLON, LVIV, InMemoryLocationRepository } from './nearest-locations.e2e.fixtures';

/** Місто тільки для координатних вікон — інакше «не розпізнано» (null). */
const CITY_BOXES: Array<{ lat: [number, number]; lng: [number, number]; city: string }> = [
  { lat: [50.4, 50.6], lng: [30.4, 30.7], city: 'Київ' },
  { lat: [49.7, 50.0], lng: [23.9, 24.2], city: 'Львів' },
];

export class MemGeocoder {
  calls: Array<[number, number]> = [];
  async reverseGeocode(lat: number, lng: number): Promise<{ city: string } | null> {
    this.calls.push([lat, lng]);
    for (const box of CITY_BOXES) {
      if (lat >= box.lat[0] && lat <= box.lat[1] && lng >= box.lng[0] && lng <= box.lng[1]) {
        return { city: box.city };
      }
    }
    return null;
  }
}

export async function buildApp(
  geocoder: MemGeocoder
): Promise<{ app: INestApplication; geocoder: MemGeocoder }> {
  const repo = new InMemoryLocationRepository();
  for (const loc of [PODIL, OBOOLON, LVIV]) await repo.save(loc);

  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [LocationsModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
      appSetting: { findUnique: async () => null, upsert: async () => undefined },
    })
    .overrideProvider(PrismaLocationRepository)
    .useValue(repo)
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(CACHED_ROUTING_GEOCODER)
    .useValue(geocoder)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, geocoder };
}
