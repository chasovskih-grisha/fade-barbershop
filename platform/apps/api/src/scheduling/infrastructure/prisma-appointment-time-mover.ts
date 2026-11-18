// Атомарний перенос часу Appointment (T-4533): без активної транзакції —
// власна Serializable; P2034 (serialization) → BookingConflictError. Саме
// транзакційне тіло — у prisma-appointment-time-mover.persist.ts.
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { currentDb } from '../../shared/prisma/prisma-context';
import { BookingConflictError } from '../domain/booking';
import type {
  AppointmentTimeMover,
  MoveTimeQuery,
} from '../application/reschedule-appointment.types';
import { persistMoveTime } from './prisma-appointment-time-mover.persist';

@Injectable()
export class PrismaAppointmentTimeMover implements AppointmentTimeMover {
  constructor(private readonly prisma: PrismaService) {}
  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async moveTime(query: MoveTimeQuery): Promise<{ oldStart: Date; oldEnd: Date } | null> {
    const persist = (db: Prisma.TransactionClient) => persistMoveTime(db, query);
    try {
      const ambient = currentDb();
      return ambient
        ? await persist(ambient)
        : await this.prisma.$transaction(persist, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034')
        throw new BookingConflictError('Slots updated, please retry');
      throw error;
    }
  }
}
