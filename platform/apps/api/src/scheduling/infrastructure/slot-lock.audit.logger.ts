// Аудит локів у структурний лог (T-4802): таймаут взяття й збій звільнення
// мають бути видимі в логах/CDR, навіть якщо клієнт отримав звичайний 409.
import { Logger } from '@nestjs/common';
import type { SlotLockAudit, SlotLockAuditEvent } from '../application/slot-lock.ports';

export class SlotLockAuditLogger implements SlotLockAudit {
  private readonly logger = new Logger('SlotLock');

  record(event: SlotLockAuditEvent): void {
    const payload = JSON.stringify({ event: `slot_lock_${event.type}`, ...event });
    if (event.type === 'timeout') this.logger.warn(payload);
    else this.logger.error(payload);
  }
}
