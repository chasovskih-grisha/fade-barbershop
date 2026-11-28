// Стрім чату візиту через справжній контролер (T-081d): авторизація до
// відкриття потоку, контракт події, ідемпотентний реплей і закриття кімнати
// після відписки. Підмінені лише порти (памʼять замість Prisma).
import { ForbiddenException, type INestApplication } from '@nestjs/common';
import type { Request } from 'express';
import type { MessageEvent } from '@nestjs/common';
import request from 'supertest';
import { as, BARBER, CLIENT, createMessagingApp, STRANGER, VISIT } from './messaging-test-app';
import { CHAT_MESSAGE_EVENT, MessagingStreamController } from './messaging-stream.controller';
import { ChatStream } from '../application/chat-stream';

const sessionOf = (userId: string) =>
  ({
    clientSession: { userId, sessionId: '0190a5f0-0000-7000-8000-000000000001' },
  }) as unknown as Request;

describe('MessagingStreamController — стрім чату візиту (T-081d)', () => {
  let app: INestApplication;
  let controller: MessagingStreamController;
  let stream: ChatStream;

  beforeAll(async () => {
    ({ app } = await createMessagingApp());
    controller = app.get(MessagingStreamController);
    stream = app.get(ChatStream);
  });

  afterAll(async () => {
    await app.close();
  });

  const send = (user: string, body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post(`/messaging/visits/${VISIT}/messages`)
      .set(as(user))
      .send(body);

  it('streams a new message of the visit to the other participant', async () => {
    const events: MessageEvent[] = [];
    const subscription = (await controller.messages(sessionOf(BARBER), VISIT)).subscribe((event) =>
      events.push(event)
    );

    await send(CLIENT, { body: 'Я вже біля входу' });

    expect(events).toEqual([
      {
        type: CHAT_MESSAGE_EVENT,
        data: expect.objectContaining({
          senderRole: 'client',
          body: 'Я вже біля входу',
          clientMessageId: null,
        }),
      },
    ]);
    subscription.unsubscribe();
  });

  it('refuses a stranger before the stream opens', async () => {
    await expect(controller.messages(sessionOf(STRANGER), VISIT)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('does not repeat a message replayed with the same clientMessageId', async () => {
    const events: MessageEvent[] = [];
    const subscription = (await controller.messages(sessionOf(BARBER), VISIT)).subscribe((event) =>
      events.push(event)
    );

    await send(CLIENT, { body: 'Перезвоніть, будь ласка', clientMessageId: 'offline-stream-1' });
    await send(CLIENT, { body: 'Перезвоніть, будь ласка', clientMessageId: 'offline-stream-1' });

    expect(events).toHaveLength(1);
    subscription.unsubscribe();
  });

  it('closes the room when the client drops the stream', async () => {
    const subscription = (await controller.messages(sessionOf(BARBER), VISIT)).subscribe(
      () => undefined
    );
    expect(stream.openRooms).toBe(1);

    subscription.unsubscribe();

    expect(stream.openRooms).toBe(0);
  });
});
