// Спільна підготовка послуги для BookAppointment (T-041): адмінський і
// клієнтський шлях ведуть той самий use case, тож валідація каталогу має
// бути одна — активність послуги й ціни в локації (MNG-ADM-10…12),
// тривалість за режимом (parallel → parallelDuration), снепшот AgreedPrice
// на записі (ADR 0006). Варіант тривалості (T-4419) перекриває тривалість і
// додає свою поправку до ціни; без вибору — поведінка до слайса.
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ServicePreparation } from '../dto/book-slot.dto';
import type { DurationVariant } from '../../catalog/domain/duration-variant';
import type { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';

interface ServiceForPreparation {
  duration: number;
  parallelDuration: number | null;
  variants?: DurationVariant[] | null;
}

/** Валідує послугу в локації і повертає тривалість + снепшот ціни. */
export async function prepareService(
  services: PrismaServiceRepository,
  input: {
    locationId: string;
    serviceId?: string;
    fulfillmentMode?: 'sequential' | 'parallel';
    serviceDuration?: number;
    /** Обраний варіант тривалості (T-4419); без нього — базова тривалість. */
    variantLabel?: string;
  }
): Promise<ServicePreparation> {
  const { locationId, serviceId, serviceDuration } = input;
  if (!serviceId) return { duration: serviceDuration ?? 30 };
  const price = await services.find(serviceId, locationId);
  const service = await services.findById(serviceId);
  // prettier-ignore
  if (!price?.active || !service?.active) throw new HttpException('Service not available at location', HttpStatus.NOT_FOUND);
  return prepared({ serviceId, basePrice: price.amount, service, input });
}

/** Тривалість і снепшот для активної послуги з ціною в локації. */
function prepared(options: {
  serviceId: string;
  basePrice: number;
  service: ServiceForPreparation;
  input: { fulfillmentMode?: 'sequential' | 'parallel'; variantLabel?: string };
}): ServicePreparation {
  const { serviceId, basePrice, service, input } = options;
  const mode = input.fulfillmentMode ?? 'sequential';
  const variant = input.variantLabel === undefined ? null : variantFor(service, input.variantLabel);
  const duration = durationFor(service, variant, mode);
  // prettier-ignore
  if (duration === 0) throw new HttpException('Fulfillment mode not supported', HttpStatus.BAD_REQUEST);
  return {
    duration,
    snapshot: {
      serviceId,
      agreedPrice: basePrice + (variant?.priceDelta ?? 0),
      agreedDuration: duration,
      fulfillmentMode: mode,
      ...(variant ? { durationVariant: variant.label } : {}),
    },
  };
}

function durationFor(
  service: ServiceForPreparation,
  variant: DurationVariant | null,
  mode: 'sequential' | 'parallel'
): number {
  // prettier-ignore
  if (mode === 'parallel') return variant?.parallelDuration ?? service.parallelDuration ?? 0;
  return variant?.duration ?? service.duration;
}

/** Невідомий підпис варіанта — помилка вводу (400), а не 500 (T-4419). */
function variantFor(service: ServiceForPreparation, label: string): DurationVariant {
  const variant = service.variants?.find((candidate) => candidate.label === label);
  if (!variant) {
    throw new HttpException(`Unknown duration variant: ${label}`, HttpStatus.BAD_REQUEST);
  }
  return variant;
}
