// Позначки доставки й прочитання чату (T-4432): історія = доставка, явний
// read = прочитання, бейдж непрочитаних у списку розмов падає до нуля.
// Справжні контролери, use cases і агрегат; підмінені лише порти.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { as, BARBER, CLIENT, createMessagingApp, STRANGER, VISIT } from './messaging-test-app';
import type { MemoryConversations } from './messaging-test-app';

const messages = (app: INestApplication, body: string, clientMessageId?: string) =>
  request(app.getHttpServer())
    .post(`/messaging/visits/${VISIT}/messages`)
    .set(as(CLIENT))
    .send({ body, ...(clientMessageId ? { clientMessageId } : {}) });

const unreadFor = async (app: INestApplication, userId: string) => {
  const response = await request(app.getHttpServer())
    .get('/messaging/conversations')
    .set(as(userId));
  expect(response.status).toBe(200);
  return response.body.conversations[0]?.unreadCount;
};

describe('MessagingController — позначки доставки й прочитання (T-4432)', () => {
  let app: INestApplication;
  let repo: MemoryConversations;

  beforeAll(async () => {
    ({ app, repo } = await createMessagingApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    repo.messages.length = 0;
    repo.rows.clear();
  });

  it('історія позначає вхідні доставленими, власні повідомлення — ні', async () => {
    await messages(app, 'Буду за 5 хвилин');
    const response = await request(app.getHttpServer())
      .get(`/messaging/visits/${VISIT}/messages`)
      .set(as(BARBER));

    expect(response.status).toBe(200);
    expect(response.body.unreadCount).toBe(1);
    const [row] = response.body.messages;
    expect(row.deliveredAt).toEqual(expect.any(String));
    expect(row.readAt).toBeNull();
    expect(repo.messages[0]?.deliveredAt).toBeInstanceOf(Date);
  });

  it('read закриває бейдж і проставляє readAt у всіх вхідних', async () => {
    await messages(app, 'Одна');
    await messages(app, 'Дві');
    expect(await unreadFor(app, BARBER)).toBe(2);

    const read = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/read`)
      .set(as(BARBER));

    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({ conversationId: expect.any(String), markedRead: 2 });
    expect(repo.messages.every((row) => row.readAt instanceof Date)).toBe(true);
    expect(await unreadFor(app, BARBER)).toBe(0);

    const history = await request(app.getHttpServer())
      .get(`/messaging/visits/${VISIT}/messages`)
      .set(as(BARBER));
    expect(history.body.unreadCount).toBe(0);
    expect(history.body.messages.every((row: { readAt: string }) => row.readAt)).toBe(true);
  });

  it('швидке листування: кожне нове повідомлення додає одне непрочитане, реплей — ні', async () => {
    await messages(app, 'Раз');
    await messages(app, 'Два');
    await messages(app, 'Два', 'offline-42');
    await messages(app, 'Два', 'offline-42');

    expect(repo.messages).toHaveLength(3);
    expect(await unreadFor(app, BARBER)).toBe(3);
  });

  it('чужий візит не читається і не позначається', async () => {
    await messages(app, 'Приватне');

    const stranger = await request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/read`)
      .set(as(STRANGER));

    expect(stranger.status).toBe(403);
    expect(repo.messages[0]?.readAt).toBeNull();
  });

  it('відправник бачить власні повідомлення без непрочитаних', async () => {
    await messages(app, 'Своє');
    expect(await unreadFor(app, CLIENT)).toBe(0);
  });

  it('бейдж шапки рахує непрочитані по всіх розмовах і падає після read', async () => {
    await messages(app, 'Одна');
    await messages(app, 'Дві');

    const badge = await request(app.getHttpServer()).get('/messaging/unread').set(as(BARBER));
    expect(badge.status).toBe(200);
    expect(badge.body).toEqual({ unreadCount: 2 });

    await request(app.getHttpServer()).post(`/messaging/visits/${VISIT}/read`).set(as(BARBER));
    const after = await request(app.getHttpServer()).get('/messaging/unread').set(as(BARBER));
    expect(after.body).toEqual({ unreadCount: 0 });
  });
});
