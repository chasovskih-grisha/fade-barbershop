// HTTP-контракт підписаного URL референсного фото (T-043, REF-WEB-03).
// Сесія обов'язкова: ендпоинт віддає фото з обличчям (ADR 0008 §2, ADR 0015 §1).
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hashToken } from '../../identity/domain/otp-code';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ReferencePhotoNotFoundError } from '../application/get-reference-photo-url';
import { HaircutAiHandlers } from './haircut-ai-handlers';
import { HaircutAiController } from './haircut-ai.controller';

const TOKEN = 'web-session-token';

const prismaFor = (userId: string | null) => ({
  session: {
    findUnique: async ({ where }: { where: { tokenHash: string } }) =>
      userId && where.tokenHash === hashToken(TOKEN)
        ? { userId, channel: 'web', revokedAt: null }
        : null,
  },
});

describe('GET /booking/reference-photos/:id', () => {
  let app: INestApplication;
  let execute: jest.Mock;

  const build = async (ownerId: string | null, owns: boolean) => {
    execute = jest.fn(async () => {
      if (!owns) throw new ReferencePhotoNotFoundError('photo-1');
      return {
        url: 'https://signed.test/u/p.jpg?ttl=900',
        contentType: 'image/jpeg',
        expiresInSeconds: 900,
      };
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [HaircutAiController],
      providers: [
        {
          provide: HaircutAiHandlers,
          useValue: {
            useCases: {
              uploadPhoto: { execute: jest.fn() },
              referencePhotoUrl: { execute },
              adminReferencePhotoUrl: { execute: jest.fn() },
            },
          },
        },
        { provide: PrismaService, useValue: prismaFor(ownerId) },
      ],
    }).compile();
    const created = moduleRef.createNestApplication();
    created.use(cookieParser());
    await created.init();
    return created;
  };

  const get = (target: INestApplication, withCookie = true) =>
    request(target.getHttpServer())
      .get('/booking/reference-photos/photo-1')
      .set('Cookie', withCookie ? `fadoidx=${TOKEN}` : '');

  afterAll(async () => {
    if (app) await app.close();
  });

  it('без сесії — 401, use case не викликається', async () => {
    app = await build(null, true);
    await get(app, false).expect(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('власник отримує 200 з url і TTL', async () => {
    app = await build('user-1', true);
    const res = await get(app).expect(200);
    expect(res.body).toMatchObject({ contentType: 'image/jpeg', expiresInSeconds: 900 });
    expect(res.body.url).toContain('signed.test');
    expect(execute).toHaveBeenCalledWith({ photoId: 'photo-1', actorId: 'user-1' });
  });

  it('чуже фото — 404, тіло не розкриває причину', async () => {
    app = await build('user-2', false);
    const res = await get(app).expect(404);
    expect(res.body.message).toBe('Фото не знайдено');
  });
});
