// Клієнтський шлях запису: перевірка політики онлайн-букінгу до резервації
// слота (T-4542). Окремим файлом — контролер тримає лише HTTP-логіку.
import { OnlineBookingBlockedError, type EvaluateOnlineBooking } from '../../booking/policy/evaluate-online-booking';
import type { ClientBookingDto } from '../dto/client-booking.dto';

export async function assertOnlinePolicyAllowed(
  policy: EvaluateOnlineBooking | undefined,
  dto: ClientBookingDto,
  clientId?: string
): Promise<void> {
  if (!policy) return;
  const result = await policy.execute({
    locationId: dto.locationId,
    action: 'create',
    start: new Date(`${dto.date}T${dto.start}:00.000Z`),
    hasAccount: Boolean(clientId),
    ...(clientId ? { clientId } : {}),
    ...(dto.barberId ? { barberId: dto.barberId } : {}),
  });
  if (!result.allowed) throw new OnlineBookingBlockedError(result.blocks);
}
