// T-083/T-4619: реєстрації SchedulingModule, які раніше жили лише в робочій
// копії — візити барбера, нагадування про дедлайн депозиту й use cases, які
// споживає адмінський контролер із PaymentModule. Модуль мусить піднятися без БД.
import { Test } from '@nestjs/testing';
import { SchedulingModule } from './scheduling.module';
import { ListClientAppointments } from './application/list-client-appointments';
import { MarkBarberUnavailable } from './application/mark-barber-unavailable.use-case';
import { ListShiftConflicts } from './application/list-shift-conflicts.use-case';
import { ResolveShiftConflict } from './application/resolve-shift-conflict.use-case';
import { NudgeExpiringHolds } from './application/nudge-expiring-holds';
import { BarberAppointmentsController } from './infrastructure/barber-appointments.controller';
import { DepositHoldNudgeWorker } from './infrastructure/deposit-hold-nudge.worker';
import { PrismaExpiringHoldNotice } from './infrastructure/prisma-expiring-hold-notice';

describe('SchedulingModule registrations (T-083/T-4619)', () => {
  it('резолвить барбер-візити, нагадування й use cases недоступності', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SchedulingModule] }).compile();

    for (const token of [
      BarberAppointmentsController,
      ListClientAppointments,
      NudgeExpiringHolds,
      PrismaExpiringHoldNotice,
      DepositHoldNudgeWorker,
      MarkBarberUnavailable,
      ListShiftConflicts,
      ResolveShiftConflict,
    ]) {
      expect(moduleRef.get(token, { strict: false })).toBeInstanceOf(token as never);
    }

    await moduleRef.close();
  });
});
