import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hashToken } from '../../identity/domain/otp-code';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../../identity/infrastructure/prisma-session-repository';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AssignStaffHandler } from '../application/assign-staff';
import { ListStaffHandler } from '../application/list-staff';
import { UnassignStaffHandler } from '../application/unassign-staff';
import { StaffModule } from '../infrastructure/staff.module';

describe('Admin staff assignments (e2e)', () => {
  let app: INestApplication;
  const cookie = 'fadoidx=admin-token';
  const users = {
    findById: jest.fn(async (id: string) => ({
      id,
      role: id === 'admin-id' ? 'admin' : 'barber',
      active: true,
    })),
  };
  const assignment = {
    id: 'assignment-1',
    barberId: 'barber-id',
    createdAt: new Date('2026-09-23T10:00:00Z'),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [StaffModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(PrismaUserRepository)
      .useValue(users)
      .overrideProvider(PrismaSessionRepository)
      .useValue({
        findByTokenHash: async (tokenHash: string) =>
          tokenHash === hashToken('admin-token')
            ? { userId: 'admin-id', channel: 'admin', revokedAt: null }
            : null,
      })
      .overrideProvider(AssignStaffHandler)
      .useValue({ handle: jest.fn(async () => ({ id: assignment.id })) })
      .overrideProvider(ListStaffHandler)
      .useValue({ listByLocation: jest.fn(async () => [assignment]) })
      .overrideProvider(UnassignStaffHandler)
      .useValue({ handle: jest.fn(async (id: string) => ({ id })) })
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());

  it('requires an admin cookie, then lists and assigns staff', async () => {
    const path = '/admin/locations/location-1/staff';
    await request(app.getHttpServer()).get(path).expect(401);
    const list = await request(app.getHttpServer()).get(path).set('Cookie', cookie).expect(200);
    expect(list.body[0].barberId).toBe('barber-id');
    const created = await request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .send({ barberId: 'barber-id' })
      .expect(201);
    expect(created.body.id).toBe('assignment-1');
  });
});
