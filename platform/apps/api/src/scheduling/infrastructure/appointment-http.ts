import { HttpException, HttpStatus } from '@nestjs/common';
import { AppointmentNotFoundError, InvalidTransitionError } from '../application/appointment-lifecycle.use-case';
import { BookingConflictError } from '../domain/booking';
import { CommentTooLongError, ReferenceLockedError } from '../application/set-appointment-reference.use-case';

const ERROR_STATUS: Array<{ when: (error: Error) => boolean; status: number }> = [
  { when: (error) => error instanceof AppointmentNotFoundError, status: HttpStatus.NOT_FOUND },
  { when: (error) => error instanceof InvalidTransitionError, status: HttpStatus.CONFLICT },
  { when: (error) => error instanceof BookingConflictError, status: HttpStatus.CONFLICT },
  { when: (error) => error instanceof CommentTooLongError, status: HttpStatus.BAD_REQUEST },
  { when: (error) => error instanceof ReferenceLockedError, status: HttpStatus.CONFLICT },
  { when: (error) => error.message.startsWith('Barber cannot'), status: HttpStatus.BAD_REQUEST },
  { when: (error) => error.name === 'InvalidSlotError', status: HttpStatus.BAD_REQUEST },
];

/** Доменна помилка візиту → HTTP. Вже-HTTP винятки (401 сесії) не переписуємо. */
export function appointmentHttpError(error: unknown): never {
  if (error instanceof HttpException) throw error;
  if (!(error instanceof Error)) throw error;
  const match = ERROR_STATUS.find(({ when }) => when(error));
  if (!match) throw error;
  throw new HttpException(error.message, match.status);
}

/** Опційне поле DTO → spread-патч під exactOptionalPropertyTypes. */
export const optional = (key: 'reason' | 'referenceId' | 'comment', value?: string) =>
  (value === undefined ? {} : { [key]: value }) as Partial<Record<typeof key, string>>;

/** Спільний результат команд життєвого циклу. */
export type CommandResult = { status: string };

/** Спільна обгортка команд життєвого циклу (admin/client): ok → {status:'ok'},
 * доменна помилка → HTTP через appointmentHttpError. */
export async function runAppointmentCommand(action: () => Promise<void>): Promise<CommandResult> {
  try {
    await action();
    return { status: 'ok' };
  } catch (error) {
    appointmentHttpError(error);
  }
}
