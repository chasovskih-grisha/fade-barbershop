// Стенд e2e релея нагадувань (T-080): піднімає лише NotificationsModule (без
// AppModule — див. docs/testing-guidelines.md §1.6) і дає спеціфікації три
// операції: подія візиту в outbox, прохід релея, прибирання своїх рядків.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { uuidv7 } from '@fade/domain-shared';
import { NotificationsModule } from '../notifications.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OutboxNotificationsDispatcher } from '../infrastructure/outbox-dispatcher';
import { PrismaAppointmentReminderSettings } from '../infrastructure/prisma-appointment-reminder-settings';
import { REMINDER_DUE_EVENT_TYPE } from '../application/appointment-reminder-ports';
import type { AppointmentReminderSettings } from '../domain/appointment-reminder-settings';

export interface ReminderRelayHarness {
  prisma: PrismaService;
  /** Один прохід релея (те саме, що робить таймер у проді). */
  poll(): Promise<{ processed: number }>;
  setSettings(settings: AppointmentReminderSettings): Promise<void>;
  /** Кладе рядок події візиту в outbox — те, що пише продюсер scheduling. */
  appendVisitEvent(input: {
    appointmentId: string;
    type: string;
    payload: object;
  }): Promise<string>;
  /** Рядки нагадування візиту (відкладені й спрацьовані). */
  reminderRows(
    appointmentId: string
  ): Promise<{ id: string; availableAt: Date | null; publishedAt: Date | null; status: string }[]>;
  /** Прибирає рядки spec'а: outbox за візитом і журнал за їхніми eventId. */
  cleanup(input: { appointmentId: string; eventIds: string[] }): Promise<void>;
  close(): Promise<void>;
}

export async function openReminderRelay(): Promise<ReminderRelayHarness> {
  const moduleRef = await Test.createTestingModule({ imports: [NotificationsModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  const prisma = app.get(PrismaService);
  const dispatcher = app.get(OutboxNotificationsDispatcher);
  const settings = app.get(PrismaAppointmentReminderSettings);

  return {
    prisma,
    poll: () => dispatcher.pollOnce(),
    setSettings: async (next) => {
      await settings.set(next);
    },
    appendVisitEvent: async ({ appointmentId, type, payload }) => {
      const row = await prisma.outboxMessage.create({
        data: { id: uuidv7(), aggregateType: 'appointment', aggregateId: appointmentId, type, payload },
      });
      return row.id;
    },
    reminderRows: async (appointmentId) => {
      const rows = await prisma.outboxMessage.findMany({
        where: { aggregateId: appointmentId, type: REMINDER_DUE_EVENT_TYPE },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(({ id, availableAt, publishedAt, status }) => ({
        id,
        availableAt,
        publishedAt,
        status,
      }));
    },
    cleanup: async ({ appointmentId, eventIds }) => {
      await prisma.outboxMessage.deleteMany({
        where: { OR: [{ aggregateId: appointmentId }, { id: { in: eventIds } }] },
      });
      await prisma.notificationRecord.deleteMany({ where: { eventId: { in: eventIds } } });
    },
    close: () => app.close(),
  };
}
