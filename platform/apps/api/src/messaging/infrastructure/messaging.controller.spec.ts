// Чат візиту через справжній HTTP контролера (T-081): сесія → use case →
// репозиторій → outbox. Підмінені лише зовнішні порти; агрегат, мапінг помилок
// і роути — справжні.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { as, BARBER, CLIENT, createMessagingApp, VISIT } from './messaging-test-app';
import type { MemoryConversations } from './messaging-test-app';

describe('MessagingController — чат візиту (T-081)', () => {
  let app: INestApplication;
  let repo: MemoryConversations;
  let outbox: { append: jest.Mock };

  beforeAll(async () => {
    ({ app, repo, outbox } = await createMessagingApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the context health route', async () => {
    const response = await request(app.getHttpServer()).get('/messaging');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', context: 'messaging' });
  });

  it('client sends a message into the visit chat and pushes the barber', async () => {
    const response = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(CLIENT))
      .send({ body: '  Буду на 5 хвилин пізніше  ' });

    expect(response.status).toBe(201);
    expect(response.body.message).toMatchObject({
      senderId: CLIENT,
      senderRole: 'client',
      body: 'Буду на 5 хвилин пізніше',
      clientMessageId: null,
    });
    expect(repo.messages).toHaveLength(1);
    expect(outbox.append).toHaveBeenCalledTimes(1);
    expect(outbox.append.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        type: 'messaging.message.created',
        aggregateId: response.body.conversationId,
        payload: expect.objectContaining({ recipientId: BARBER, senderRole: 'client' }),
      }),
    ]);
  });

  it('barber replies in the same conversation and the client is pushed', async () => {
    const response = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(BARBER))
      .send({ body: 'Ок, чекаю' });

    expect(response.status).toBe(201);
    expect(response.body.message.senderRole).toBe('barber');
    expect(outbox.append.mock.calls[0][0][0].payload.recipientId).toBe(CLIENT);
  });

  it('offline replay with the same clientMessageId keeps one row and one push', async () => {
    const payload = { body: 'Пишу з метро, інтернет зникає', clientMessageId: 'offline-1' };
    const first = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(CLIENT))
      .send(payload);
    const second = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(CLIENT))
      .send(payload);

    expect(first.status).toBe(201);
    expect(first.body.duplicate).toBe(false);
    expect(second.status).toBe(201);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.message.id).toBe(first.body.message.id);
    expect(repo.messages.filter((row) => row.clientMessageId === 'offline-1')).toHaveLength(1);
    expect(outbox.append).toHaveBeenCalledTimes(1);
  });

  it('returns the visit history in order for both participants', async () => {
    const response = await request(app.getHttpServer())
      .get(`/messaging/visits/${VISIT}/messages`)
      .set(as(BARBER));

    expect(response.status).toBe(200);
    expect(response.body.messages.map((row: { body: string }) => row.body)).toEqual([
      'Буду на 5 хвилин пізніше',
      'Ок, чекаю',
      'Пишу з метро, інтернет зникає',
    ]);
  });
});
