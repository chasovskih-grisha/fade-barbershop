import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hashToken } from '../../identity/domain/otp-code';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ListClientAppointments } from '../application/list-client-appointments';
import { ClientAppointmentListController } from './client-appointment-list.controller';
import { webClientId } from './client-web-session';

const TOKEN = 'web-session-token';

function sessionPrisma(
  session: { userId: string; channel: string; revokedAt: Date | null } | null
) {
  return {
    session: {
      findUnique: jest.fn(async ({ where }: { where: { tokenHash: string } }) =>
        where.tokenHash === hashToken(TOKEN) ? session : null
      ),
    },
  };
}

describe('GET /booking/appointments', () => {
  let app: INestApplication;
  const handle = jest.fn().mockResolvedValue([{ id: 'apt-1', status: 'upcoming' }]);

  beforeAll(async () => {
    const prisma = sessionPrisma({ userId: 'user-1', channel: 'web', revokedAt: null });
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientAppointmentListController],
      providers: [
        { provide: ListClientAppointments, useValue: { handle } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());

  it('без cookie — 401', async () => {
    await request(app.getHttpServer()).get('/booking/appointments').expect(401);
  });

  it('чужий токен — 401', async () => {
    await request(app.getHttpServer())
      .get('/booking/appointments')
      .set('Cookie', 'fadoidx=not-the-session')
      .expect(401);
  });

  it('валідна web-сесія віддає візити цього клієнта', async () => {
    const res = await request(app.getHttpServer())
      .get('/booking/appointments')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .expect(200);
    expect(res.body).toEqual([{ id: 'apt-1', status: 'upcoming' }]);
    expect(handle).toHaveBeenCalledWith('user-1');
  });
});

describe('webClientId', () => {
  it('гість без cookie — null, список без сесії — 401', async () => {
    const prisma = sessionPrisma(null) as never;
    const req = { cookies: {} } as never;
    await expect(webClientId(req, prisma, false)).resolves.toBeNull();
    await expect(webClientId(req, prisma, true)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('відкликана або не web-сесія не проходить', async () => {
    const revoked = sessionPrisma({ userId: 'user-1', channel: 'web', revokedAt: new Date() });
    const req = { cookies: { fadoidx: TOKEN } } as never;
    await expect(webClientId(req, revoked as never, false)).resolves.toBeNull();
    const admin = sessionPrisma({ userId: 'user-1', channel: 'admin', revokedAt: null });
    await expect(webClientId(req, admin as never, true)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });
});
