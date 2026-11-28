// Спільна збірка HTTP-застосунку для спек чату (T-081): справжній контролер,
// use cases і мапінг помилок; підмінені лише порти — пам'ять замість Prisma,
// Booking-ACL і outbox. Винесено зі спек за LOC-гейтом.
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CONVERSATION_REPOSITORY, MESSAGING_OUTBOX, VISIT_PARTICIPANTS } from '../domain/ports';
import type { VisitParties } from '../domain/ports';
import { ListChatMessages } from '../application/list-chat-messages.use-case';
import { MarkConversationRead } from '../application/mark-conversation-read.use-case';
import { MessagingService } from '../application/messaging.service';
import { SendChatMessage } from '../application/send-chat-message.use-case';
import { ClientSessionGuard } from '../../identity/infrastructure/client-session.guard';
import { MessagingController } from './messaging.controller';
import { MessagingStreamController } from './messaging-stream.controller';
import { MessagingReceiptController } from './messaging-receipt.controller';
import { MemoryConversations } from './messaging-test-repo';

export { MemoryConversations };
import { ChatStream } from '../application/chat-stream';
import { ChatAnnouncer } from '../application/chat-announcer';

export const CLIENT = '11111111-1111-4111-8111-111111111111';
export const BARBER = '22222222-2222-4222-8222-222222222222';
export const STRANGER = '33333333-3333-4333-8333-333333333333';
export const VISIT = '44444444-4444-4444-8444-444444444444';

export const as = (userId: string) => ({ 'x-test-user': userId });

const guard = {
  canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
    const req = context.switchToHttp().getRequest() as {
      headers: Record<string, string>;
      clientSession?: { userId: string; sessionId: string };
    };
    const userId = req.headers['x-test-user'];
    if (!userId) throw new UnauthorizedException('Client session required');
    req.clientSession = { userId, sessionId: '0190a5f0-0000-7000-8000-000000000001' };
    return true;
  },
};

const parties: (visitId: string) => Promise<VisitParties | null> = async (visitId) =>
  visitId === VISIT ? { clientId: CLIENT, barberId: BARBER } : null;

export async function createMessagingApp() {
  const repo = new MemoryConversations();
  const outbox = { append: jest.fn(async () => undefined) };
  const module = await Test.createTestingModule({
    controllers: [MessagingController, MessagingStreamController, MessagingReceiptController],
    providers: [
      MessagingService,
      ChatStream,
      ChatAnnouncer,
      SendChatMessage,
      ListChatMessages,
      MarkConversationRead,
      { provide: CONVERSATION_REPOSITORY, useValue: repo },
      { provide: VISIT_PARTICIPANTS, useValue: { parties: (id: string) => parties(id) } },
      { provide: MESSAGING_OUTBOX, useValue: outbox },
    ],
  })
    .overrideGuard(ClientSessionGuard)
    .useValue(guard)
    .compile();
  const app: INestApplication = module.createNestApplication();
  await app.init();
  return { app, repo, outbox };
}
