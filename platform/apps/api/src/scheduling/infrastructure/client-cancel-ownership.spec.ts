import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { ClientCancelController } from './client-cancel.controller';

const TOKEN = 'web-session-token';

describe('чужий візит', () => {
  let app: INestApplication;
  const cancel = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientCancelController],
      providers: [
        { provide: AppointmentLifecycle, useValue: { cancel } },
        {
          provide: PrismaService,
          useValue: {
            session: {
              findUnique: jest.fn(async () => ({
                userId: 'user-1',
                channel: 'web',
                revokedAt: null,
              })),
            },
            booking: { findFirst: jest.fn(async () => null) },
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());

  it('не скасовує чужий запис', async () => {
    await request(app.getHttpServer())
      .post('/appointments/apt-9/cancel')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .expect(404);
    expect(cancel).not.toHaveBeenCalled();
  });
});
