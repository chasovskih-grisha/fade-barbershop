// Спільна підготовка послуги для BookAppointment (T-041): адмінський і
// клієнтський шлях ведуть той самий use case, тож валідація каталогу має
// бути одна — активність послуги й ціни в локації (MNG-ADM-10…12),
// тривалість за режимом виконання (parallel → parallelDuration), снепшот
// AgreedPrice на записі (ADR 0006).
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ServicePreparation } from '../dto/book-slot.dto';
import type { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';

/** Валідує послугу в локації і повертає тривалість + снепшот ціни. */
export async function prepareService(
  services: PrismaServiceRepository,
  // prettier-ignore
  input: { locationId: string; serviceId?: string; fulfillmentMode?: 'sequential' | 'parallel'; serviceDuration?: number }
): Promise<ServicePreparation> {
  const { locationId, serviceId, fulfillmentMode, serviceDuration } = input;
  if (!serviceId) return { duration: serviceDuration ?? 30 };
  const price = await services.find(serviceId, locationId);
  const service = await services.findById(serviceId);
  // prettier-ignore
  if (!price?.active || !service?.active) throw new HttpException('Service not available at location', HttpStatus.NOT_FOUND);
  const mode = fulfillmentMode ?? 'sequential';
  // prettier-ignore
  const duration = mode === 'parallel' ? (service.parallelDuration ?? 0) : service.duration;
  // prettier-ignore
  if (duration === 0) throw new HttpException('Fulfillment mode not supported', HttpStatus.BAD_REQUEST);
  return {
    duration,
    snapshot: {
      serviceId,
      agreedPrice: price.amount,
      agreedDuration: duration,
      fulfillmentMode: mode,
    },
  };
}
