// Помилки домену чату → HTTP (T-081): не учасник 403, порожнє/задовге тіло 400,
// відсутній візит 404. Невідому помилку не ковтаємо — нехай падає 500.
import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { InvalidMessageBody, NotAVisitParticipant, VisitNotFound } from '../domain/conversation';

export function toChatHttp(error: unknown): HttpException {
  if (error instanceof NotAVisitParticipant) return new ForbiddenException(error.message);
  if (error instanceof VisitNotFound) return new NotFoundException(error.message);
  if (error instanceof InvalidMessageBody) return new BadRequestException(error.message);
  throw error;
}
