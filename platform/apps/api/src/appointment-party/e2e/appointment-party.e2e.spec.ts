import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppointmentPartyModule } from '../../appointment-party/appointment-party.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';

/** Simple in‑memory repo to capture saved entity */
class InMemoryRepo {
  saved: any = null;
  async save(party: any) {
    this.saved = party;
  }
  async findById() {
    return null;
  }
  async findByDate() {
    return [];
  }
}

describe('AppointmentPartyController (e2e)', () => {
  let app: INestApplication;
  let repo: InMemoryRepo;
  let availabilityQuery: jest.Mock;

  beforeAll(async () => {
    repo = new InMemoryRepo();
    availabilityQuery = jest.fn(async () => [{ start: '08:00', end: '18:00' }]);
    const prisma = {
      $connect: () => undefined,
      $disconnect: () => undefined,
      location: { findUnique: async () => ({ active: true }) },
      user: {
        findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
          where.id.in.map((id) => ({ id })),
      },
      staffAssignment: {
        findMany: async ({ where }: { where: { barberId: { in: string[] } } }) =>
          where.barberId.in.map((barberId) => ({ barberId })),
      },
      availabilityWindow: { findMany: availabilityQuery },
      openingHour: { findUnique: async () => ({ open: '08:00', close: '18:00', closed: false }) },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppointmentPartyModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider('AppointmentPartyRepository')
      .useValue(repo)
      .overrideProvider(PrismaServiceRepository)
      .useValue({
        findById: async () => ({ active: true }),
        find: async () => ({ id: 'price-123', active: true, amount: 900 }),
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a sequential appointment party and returns its id', async () => {
    const payload = {
      date: '2026-10-01',
      locationId: 'location-1',
      serviceId: 'father-son',
      mode: 'sequential',
      barberIds: ['barber-1', 'barber-1'],
      slots: [{ start: '2026-10-01T09:00:00Z', end: '2026-10-01T10:30:00Z' }],
      partyLegs: [
        { id: 'leg-1', role: 'father', name: 'Father', age: 40, barberId: 'barber-1' },
        { id: 'leg-2', role: 'son', name: 'Son', age: 10, barberId: 'barber-1' },
      ],
    };
    // Під тяжким паралельним бігом 100 сюїт supertest може впасти на транспортному
    // рівні (ECONNRESET/socket hang up) — повтор за контрактом клієнта.
    // prettier-ignore
    const post = () => request(app.getHttpServer()).post('/admin/appointment-parties').send(payload);
    let response = await post();
    // prettier-ignore
    for (let attempt = 0; attempt < 3 && response.status === undefined; attempt += 1) response = await post();
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(repo.saved).not.toBeNull();
    expect(repo.saved.id).toBe(response.body.id);
    expect(availabilityQuery).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ dayOfWeek: 3 }) })
    );
  });
});
