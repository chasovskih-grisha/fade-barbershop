// T-4458: згода клієнта застосовується тим самим RescheduleAppointment (T-042),
// що й адмінське перенесення: перевіряє Availability, OpeningHours, тривалість
// і зайнятість барбера/крісел, потім атомарно рухає Booking і пише outbox.
import { Injectable } from '@nestjs/common';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import type {
  ScheduleChangeApplier,
  ScheduleChangeConfirmedEvent,
} from '../application/schedule-change-approval.service';

@Injectable()
export class RescheduleScheduleChangeApplier implements ScheduleChangeApplier {
  constructor(private readonly reschedule: RescheduleAppointment) {}

  async apply(event: ScheduleChangeConfirmedEvent): Promise<void> {
    await this.reschedule.handle({
      appointmentId: event.payload.appointmentId,
      actorId: event.payload.clientId,
      actorRole: 'client',
      date: event.payload.to.date,
      start: event.payload.to.start,
      end: event.payload.to.end,
    });
  }
}
