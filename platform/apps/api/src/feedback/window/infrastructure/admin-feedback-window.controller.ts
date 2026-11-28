// Внутрішня поверхня вікон відгуку (T-150): відкриття з `AppointmentCompleted`
// (ідемпотентно), тик нагадувань і прибирання прострочених. Шлях під `/admin/`,
// тож глобальний `AdminSessionGuard` закриває його адмін-сесією.
import { Body, Controller, Param, Post } from '@nestjs/common';
import { FeedbackWindowService } from '../application/feedback-window.service';
import { toFeedbackWindowHttp } from './feedback-window-http.mapper';

export type OpenFeedbackWindowDto = {
  appointmentId?: unknown;
  clientId?: unknown;
  barberId?: unknown;
  locationId?: unknown;
  completedAt?: unknown;
};

@Controller('admin/feedback-windows')
export class AdminFeedbackWindowController {
  constructor(private readonly windows: FeedbackWindowService) {}

  @Post('open')
  async open(@Body() dto: OpenFeedbackWindowDto) {
    try {
      const completedAt =
        typeof dto?.completedAt === 'string' ? new Date(dto.completedAt) : undefined;
      return await this.windows.open({
        appointmentId: String(dto?.appointmentId ?? ''),
        clientId: String(dto?.clientId ?? ''),
        barberId: typeof dto?.barberId === 'string' ? dto.barberId : null,
        locationId: typeof dto?.locationId === 'string' ? dto.locationId : null,
        ...(completedAt ? { completedAt } : {}),
      });
    } catch (error) {
      throw toFeedbackWindowHttp(error);
    }
  }

  @Post(':appointmentId/reminder-due')
  async reminder(@Param('appointmentId') appointmentId: string) {
    return this.windows.reminderFor(appointmentId);
  }

  @Post('expire-overdue')
  async expireOverdue() {
    return this.windows.expireOverdue();
  }
}
