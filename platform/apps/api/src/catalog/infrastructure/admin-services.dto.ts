import type { Request } from 'express';
import { CreateServiceHandler, type CreateServiceInput } from '../application/create-service';
import { UpdateServiceHandler } from '../application/update-service';
import { SetServiceActiveHandler } from '../application/set-service-active';
import { ListServicesHandler } from '../application/list-services';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaServiceRepository } from './prisma-service.repository';
import { PrismaCatalogAuditRepository } from './prisma-catalog-audit.repository';

/** Токен зібраних залежностей AdminServicesController (провайдер у ServicesModule). */
export const ADMIN_SERVICES_IO = Symbol('ADMIN_SERVICES_IO');

export interface AdminServicesDeps {
  createService: CreateServiceHandler;
  updateService: UpdateServiceHandler;
  setServiceActive: SetServiceActiveHandler;
  listServices: ListServicesHandler;
  prisma: PrismaService;
  repo: PrismaServiceRepository;
  audit: PrismaCatalogAuditRepository;
}

export type CreateServiceDto = {
  name: string;
  duration: number;
  parallelDuration?: number | null;
  description?: string | null;
  category?: string | null;
  slug?: string | null;
  seoDescription?: string | null;
  faq?: any | null;
  sortOrder?: number;
};
export type UpdateServiceDto = {
  name?: string;
  duration?: number;
  parallelDuration?: number | null;
  description?: string | null;
  category?: string | null;
  slug?: string | null;
  seoDescription?: string | null;
  faq?: any | null;
  sortOrder?: number;
  active?: boolean;
};
export type SetPriceDto = { amount: number; active?: boolean };
export type PriceSlug = { serviceId: string; locationId: string };
export type AdminRequest = Request & { adminUserId?: string };

export function toCreateServiceInput(dto: CreateServiceDto): CreateServiceInput {
  return {
    name: dto.name,
    duration: dto.duration,
    ...(dto.parallelDuration !== undefined ? { parallelDuration: dto.parallelDuration } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.category !== undefined ? { category: dto.category } : {}),
    ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
    ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
    ...(dto.faq !== undefined ? { faq: dto.faq } : {}),
    ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
  };
}
