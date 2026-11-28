// Композиційний корінь контексту messaging (T-081): реальний чат візиту —
// агрегат, Prisma-репозиторій, ACL до Booking, outbox-подія й HTTP.
import { Module } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaSessionRepository } from '../identity/infrastructure/prisma-session-repository';
import { ClientSessionGuard } from '../identity/infrastructure/client-session.guard';
import { MessagingController } from './infrastructure/messaging.controller';
import { MessagingStreamController } from './infrastructure/messaging-stream.controller';
import { MessagingReceiptController } from './infrastructure/messaging-receipt.controller';
import { ChatStream } from './application/chat-stream';
import { ChatAnnouncer } from './application/chat-announcer';
import { MessagingService } from './application/messaging.service';
import { ListChatMessages } from './application/list-chat-messages.use-case';
import { MarkConversationRead } from './application/mark-conversation-read.use-case';
import { SendChatMessage } from './application/send-chat-message.use-case';
import { PrismaConversationRepository } from './infrastructure/prisma-conversation.repository';
import { PrismaVisitParticipants } from './infrastructure/prisma-visit-participants';
import { PrismaMessagingOutbox } from './infrastructure/prisma-messaging-outbox';
import { CONVERSATION_REPOSITORY, MESSAGING_OUTBOX, VISIT_PARTICIPANTS } from './domain/ports';

@Module({
  controllers: [MessagingController, MessagingStreamController, MessagingReceiptController],
  providers: [
    MessagingService,
    ChatStream,
    ChatAnnouncer,
    SendChatMessage,
    ListChatMessages,
    MarkConversationRead,
    PrismaService,
    PrismaSessionRepository,
    ClientSessionGuard,
    PrismaConversationRepository,
    PrismaVisitParticipants,
    PrismaMessagingOutbox,
    { provide: CONVERSATION_REPOSITORY, useExisting: PrismaConversationRepository },
    { provide: VISIT_PARTICIPANTS, useExisting: PrismaVisitParticipants },
    { provide: MESSAGING_OUTBOX, useExisting: PrismaMessagingOutbox },
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
