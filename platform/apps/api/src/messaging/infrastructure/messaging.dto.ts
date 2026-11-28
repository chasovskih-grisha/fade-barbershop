// DTO чату (T-081). Тіло приходить із mobile: текст і необов'язковий ключ
// офлайн-черги. Нічого, крім цих двох полів, сервер не читає.
export type SendChatMessageDto = {
  body?: unknown;
  clientMessageId?: unknown;
};

/** Подія SSE-стріму (T-081d): нове повідомлення візиту без даних сесії. */
export type ChatStreamEvent = {
  id: string;
  senderRole: 'client' | 'barber';
  body: string;
  createdAt: string;
  clientMessageId: string | null;
};

export type ChatMessageDto = {
  id: string;
  senderId: string;
  senderRole: 'client' | 'barber';
  body: string;
  clientMessageId: string | null;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};
