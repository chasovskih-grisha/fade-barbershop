// Агрегат «розмова» (T-081): один діалог на візит (Booking.id). Учасники —
// клієнт візиту та його барбер; усе інше — не учасник. Тіло повідомлення
// тримає ліміт, щоб чат не ставав сховищем файлів. Ідемпотентність офлайн-
// черги тримається на `clientMessageId`, який клієнт повторює при реплеї.
export const MAX_MESSAGE_LENGTH = 2000;

export type ParticipantRole = 'client' | 'barber';

export type ConversationSnapshot = {
  id: string;
  visitId: string;
  clientId: string;
  barberId: string;
  createdAt: Date;
  lastMessageAt: Date | null;
};

export type MessageSnapshot = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ParticipantRole;
  body: string;
  clientMessageId: string | null;
  createdAt: Date;
  /** Коли отримувач дістав повідомлення (історія/стрім) — T-4432. */
  deliveredAt: Date | null;
  /** Коли отримувач прочитав розмову — T-4432. */
  readAt: Date | null;
};

/** Пише не учасник візиту — HTTP 403. */
export class NotAVisitParticipant extends Error {
  constructor() {
    super('Only the visit client and barber can use this chat');
  }
}

/** Порожнє або задовге тіло — HTTP 400. */
export class InvalidMessageBody extends Error {
  constructor(readonly reason: 'empty' | 'too-long') {
    super(reason === 'empty' ? 'Message body is empty' : 'Message body is too long');
  }
}

/** Візиту немає (або він без клієнта/барбера) — HTTP 404. */
export class VisitNotFound extends Error {
  constructor() {
    super('Visit not found');
  }
}

export class Conversation {
  private constructor(private readonly snapshot: ConversationSnapshot) {}

  static open(snapshot: ConversationSnapshot): Conversation {
    return new Conversation(snapshot);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get visitId(): string {
    return this.snapshot.visitId;
  }

  get clientId(): string {
    return this.snapshot.clientId;
  }

  get barberId(): string {
    return this.snapshot.barberId;
  }

  get createdAt(): Date {
    return this.snapshot.createdAt;
  }

  get lastMessageAt(): Date | null {
    return this.snapshot.lastMessageAt;
  }

  roleOf(userId: string): ParticipantRole | null {
    if (userId === this.snapshot.clientId) return 'client';
    if (userId === this.snapshot.barberId) return 'barber';
    return null;
  }

  assertParticipant(userId: string): ParticipantRole {
    const role = this.roleOf(userId);
    if (!role) throw new NotAVisitParticipant();
    return role;
  }

  /** Співрозмовник для push: пише клієнт — отримує барбер, і навпаки. */
  recipientFor(senderId: string): string {
    return this.assertParticipant(senderId) === 'client'
      ? this.snapshot.barberId
      : this.snapshot.clientId;
  }

  compose(input: {
    id: string;
    senderId: string;
    body: string;
    clientMessageId?: string | null;
    createdAt: Date;
  }): MessageSnapshot {
    const body = String(input.body ?? '').trim();
    if (body.length === 0) throw new InvalidMessageBody('empty');
    if (body.length > MAX_MESSAGE_LENGTH) throw new InvalidMessageBody('too-long');
    const clientMessageId = input.clientMessageId?.trim() || null;
    return {
      id: input.id,
      conversationId: this.snapshot.id,
      senderId: input.senderId,
      senderRole: this.assertParticipant(input.senderId),
      body,
      clientMessageId,
      createdAt: input.createdAt,
      deliveredAt: null,
      readAt: null,
    };
  }
}
