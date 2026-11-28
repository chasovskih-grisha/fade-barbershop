// Живий стрім чату (T-081d): шина в памʼяті процесу. Підписник отримує нові
// повідомлення розмови без перезапиту історії; ключ — id розмови, бо підписка
// йде за візитом. Відписка (клієнт відпав) прибирає порожню кімнату, тож
// стрім не тримає посилань на закриті зʼєднання.
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { MessageSnapshot } from '../domain/conversation';

@Injectable()
export class ChatStream {
  private readonly rooms = new Map<string, Subject<MessageSnapshot>>();

  publish(conversationId: string, message: MessageSnapshot): void {
    this.rooms.get(conversationId)?.next(message);
  }

  stream(conversationId: string): Observable<MessageSnapshot> {
    const room = this.roomOf(conversationId);
    return new Observable<MessageSnapshot>((subscriber) => {
      const subscription = room.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        if (!room.observed) this.rooms.delete(conversationId);
      };
    });
  }

  /** Кількість відкритих кімнат — для тестів і діагностики витоку підписок. */
  get openRooms(): number {
    return this.rooms.size;
  }

  private roomOf(conversationId: string): Subject<MessageSnapshot> {
    const existing = this.rooms.get(conversationId);
    if (existing) return existing;
    const room = new Subject<MessageSnapshot>();
    this.rooms.set(conversationId, room);
    return room;
  }
}
