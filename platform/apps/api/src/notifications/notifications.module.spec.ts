// Wiring-регресія (патерн haircut-ai.module.spec): модуль резолвить споживача
// з EMAIL_SENDER/журналу/контактів, нагадування T-080 (планувальник і
// споживач reminder.due) та релей, а поллер не стартує в тестовому середовищі
// (інакше jest ловив би фонові опитування БД).

import { Test } from '@nestjs/testing';
import { NotificationsModule } from './notifications.module';
import { SendBookingConfirmation } from './application/send-booking-confirmation';
import { ScheduleAppointmentReminder } from './application/schedule-appointment-reminder';
import { SendAppointmentReminder } from './application/send-appointment-reminder';
import { AppointmentPushNotification } from './application/appointment-push';
import { OutboxNotificationsDispatcher } from './infrastructure/outbox-dispatcher';

describe('NotificationsModule wiring', () => {
  it('резолвить споживачів і диспетчер; автостарт у тестах бездіяльний', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [NotificationsModule] }).compile();

    expect(moduleRef.get(SendBookingConfirmation)).toBeInstanceOf(SendBookingConfirmation);
    expect(moduleRef.get(ScheduleAppointmentReminder)).toBeInstanceOf(ScheduleAppointmentReminder);
    expect(moduleRef.get(SendAppointmentReminder)).toBeInstanceOf(SendAppointmentReminder);
    expect(moduleRef.get(AppointmentPushNotification)).toBeInstanceOf(AppointmentPushNotification);
    expect(moduleRef.get(OutboxNotificationsDispatcher)).toBeInstanceOf(
      OutboxNotificationsDispatcher
    );
    expect(() =>
      moduleRef.get(OutboxNotificationsDispatcher).onApplicationBootstrap()
    ).not.toThrow();

    await moduleRef.close();
  });
});
