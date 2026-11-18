import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Req,
  UseFilters,
} from '@nestjs/common';
import { InvalidServiceInputError, ServiceNotFoundError } from '../application/services-errors';
import { ServicesExceptionFilter } from './services.exception-filter';
import {
  ADMIN_SERVICES_IO,
  type AdminRequest,
  type AdminServicesDeps,
  type PriceSlug,
  type SetPriceDto,
} from './admin-services.dto';

@Controller('admin/services')
@UseFilters(ServicesExceptionFilter)
export class AdminServicesPricesController {
  constructor(@Inject(ADMIN_SERVICES_IO) private readonly deps: AdminServicesDeps) {}

  @Patch(':serviceId/prices/:locationId')
  async setPrice(
    @Param() params: PriceSlug,
    @Body() dto: SetPriceDto,
    @Req() request: AdminRequest
  ): Promise<{ serviceId: string; locationId: string; amount: number; active: boolean }> {
    const { serviceId, locationId } = params;
    if (!Number.isInteger(dto.amount) || dto.amount <= 0)
      throw new InvalidServiceInputError('Price must be a positive integer');
    if (!(await this.deps.listServices.findById(serviceId))) throw new ServiceNotFoundError();
    if (!(await this.deps.prisma.location.findUnique({ where: { id: locationId } })))
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    const price = {
      serviceId,
      locationId,
      amount: dto.amount,
      active: dto.active ?? true,
      updatedAt: new Date(),
    };
    await this.deps.audit.savePriceChange(price, request.adminUserId ?? 'unknown');
    return { serviceId, locationId, amount: price.amount, active: price.active };
  }
}
