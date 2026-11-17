import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LocationsModule } from '../../locations/infrastructure/locations.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaLocationLogoRepository } from '../../locations/infrastructure/prisma-location-logo.repository';
import { FakeLocationLogoRepository } from '../../locations/application/ports.fakes.extra';
import { PrismaOutboxPublisher } from '../../locations/infrastructure/prisma-locations-outbox';
import { InMemoryLocationRepo, locationPayload } from './locations.e2e.helpers';

describe('Locations (e2e)', () => {
  let app: INestApplication;
  let repo: InMemoryLocationRepo;

  beforeAll(async () => {
    repo = new InMemoryLocationRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LocationsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: () => undefined,
        $disconnect: () => undefined,
        $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
      })
      .overrideProvider(PrismaLocationRepository)
      .useValue(repo)
      .overrideProvider(PrismaLocationLogoRepository)
      .useValue(new FakeLocationLogoRepository())
      .overrideProvider(PrismaOutboxPublisher)
      .useValue({ append: async () => undefined })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('CRUD, крісла і вимкнення локації', async () => {
    const http = app.getHttpServer();
    const created = await request(http)
      .post('/admin/locations')
      .send(locationPayload('clt-01'))
      .expect(201);
    const id = created.body.id;

    const listed = await request(http).get('/admin/locations').expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].code).toBe('CLT-01');
    expect(listed.body[0].chairs).toHaveLength(2);

    await request(http)
      .patch(`/admin/locations/${id}`)
      .send({
        name: 'Fade Podil',
        chairs: [
          { number: 1, name: 'Крісло 1', active: true },
          { number: 2, name: null, active: false },
        ],
      })
      .expect(200);

    const updated = await request(http).get(`/admin/locations/${id}`).expect(200);
    expect(updated.body.name).toBe('Fade Podil');
    expect(updated.body.chairs[1].active).toBe(false);

    await request(http).post(`/admin/locations/${id}/disable`).expect(200);
    const publicList = await request(http).get('/locations').expect(200);
    expect(publicList.body).toHaveLength(0);

    await request(http).post(`/admin/locations/${id}/enable`).expect(200);
    const enabled = await request(http).get('/locations').expect(200);
    expect(enabled.body).toHaveLength(1);
  });

  it('дублікат коду повертає 409', async () => {
    const http = app.getHttpServer();
    await request(http).post('/admin/locations').send(locationPayload('clt-02')).expect(201);
    await request(http).post('/admin/locations').send(locationPayload('clt-02')).expect(409);
  });
});
