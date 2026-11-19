// T-4458: приймач подій погодженої зміни часу.
// In-memory: durable outbox-адаптер для `scheduling.appointment.change_confirmed`
// з'явиться разом із перенесенням заявок у Prisma; контракт події вже
// зафіксований і покритий тестами, тож заміна зводиться до одного провайдера.
import { Injectable } from '@nestjs/common';
import type {
  ScheduleChangeConfirmedEvent,
  ScheduleChangeEvents,
} from '../application/schedule-change-approval.service';

@Injectable()
export class RecordingScheduleChangeEvents implements ScheduleChangeEvents {
  private readonly recorded: ScheduleChangeConfirmedEvent[] = [];

  async append(event: ScheduleChangeConfirmedEvent): Promise<void> {
    // Один `eventId` — одна подія: дубль від at-least-once доставки ігнорується.
    if (this.recorded.some((item) => item.payload.eventId === event.payload.eventId)) return;
    this.recorded.push(event);
  }

  /** Для тестів і адмін-аудиту: що вже прийнято. */
  list(): ScheduleChangeConfirmedEvent[] {
    return [...this.recorded];
  }
}
