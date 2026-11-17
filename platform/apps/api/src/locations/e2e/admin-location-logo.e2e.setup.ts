// Харнес e2e-тестів логотипа локації (T-4609a): LocationsModule поверх фейків
// (реальна БД і S3 не потрібні), мультипарт — multer з memoryStorage, як у проді.
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { LocationsModule } from '../../locations/infrastructure/locations.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaLocationLogoRepository } from '../../locations/infrastructure/prisma-location-logo.repository';
import { PrismaOutboxPublisher } from '../../locations/infrastructure/prisma-locations-outbox';
import { FakeLocationLogoRepository } from '../../locations/application/ports.fakes.extra';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import { MemPublicMediaStorage } from '../../shared/media/public-media-storage.fakes';
import { InMemoryLocationRepo, locationPayload } from './locations.e2e.helpers';

export const PNG_BYTES = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);

export async function buildLogoApp() {
  const repo = new InMemoryLocationRepo();
  const logos = new FakeLocationLogoRepository();
  const media = new MemPublicMediaStorage();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [LocationsModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
    })
    .overrideProvider(PrismaLocationRepository)
    .useValue(repo)
    .overrideProvider(PrismaLocationLogoRepository)
    .useValue(logos)
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(PUBLIC_MEDIA_STORAGE)
    .useValue(media)
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  return { app, repo, logos, media };
}

/** Створює локацію через API і повертає її id. */
export async function seedLocationViaApi(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/admin/locations')
    .send(locationPayload('clt-01'))
    .expect(201);
  return res.body.id as string;
}

/** multipart-запит на завантаження логотипа. */
export function putLogo(
  app: INestApplication,
  id: string,
  fields: { variant?: string; alt?: string; light?: boolean; dark?: boolean }
) {
  let req = request(app.getHttpServer()).put(`/admin/locations/${id}/logo`);
  if (fields.variant !== undefined) req = req.field('variant', fields.variant);
  if (fields.alt !== undefined) req = req.field('alt', fields.alt);
  if (fields.light !== false) {
    req = req.attach('light', PNG_BYTES, { filename: 'light.png', contentType: 'image/png' });
  }
  if (fields.dark) {
    req = req.attach('dark', PNG_BYTES, { filename: 'dark.png', contentType: 'image/png' });
  }
  return req;
}
