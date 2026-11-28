// Вхід у чат (T-081): GET /messaging/conversations віддає лише розмови
// поточного користувача — клієнта або його барбера, ніколи чужі.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { as, CLIENT, createMessagingApp, STRANGER, VISIT } from './messaging-test-app';

describe('MessagingController — вхід у чат і відмови (T-081)', () => {
  let app: INestApplication;
  let outbox: { append: jest.Mock };

  beforeAll(async () => {
    ({ app, outbox } = await createMessagingApp());
    await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(CLIENT))
      .send({ body: 'Добрий день' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists only the conversations of the caller', async () => {
    const mine = await request(app.getHttpServer())
      .get('/messaging/conversations')
      .set(as(CLIENT));
    const strangers = await request(app.getHttpServer())
      .get('/messaging/conversations')
      .set(as(STRANGER));

    expect(mine.status).toBe(200);
    expect(mine.body.conversations).toEqual([
      expect.objectContaining({ visitId: VISIT, clientId: CLIENT }),
    ]);
    expect(strangers.status).toBe(200);
    expect(strangers.body.conversations).toEqual([]);
  });

  it('refuses a user who is not a participant of the visit', async () => {
    const send = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(STRANGER))
      .send({ body: 'Привіт' });
    const read = await request(app.getHttpServer())
      .get(`/messaging/visits/${VISIT}/messages`)
      .set(as(STRANGER));

    expect(send.status).toBe(403);
    expect(read.status).toBe(403);
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('rejects an empty body and an unknown visit', async () => {
    const empty = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(CLIENT))
      .send({ body: '   ' });
    const missing = await request(app.getHttpServer())
      .post('/messaging/visits/55555555-5555-4555-8555-555555555555/messages')
      .set(as(CLIENT))
      .send({ body: 'Привіт' });

    expect(empty.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('requires a client session', async () => {
    const response = await request(app.getHttpServer())
      .get(`/messaging/visits/${VISIT}/messages`)
      .set({ 'x-test-user': '' });
    expect(response.status).toBe(401);
  });
});
