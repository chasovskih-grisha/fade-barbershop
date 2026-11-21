/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 12 vs 10); refactor tracked in T-2500f */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import { ServicesExceptionFilter } from './services.exception-filter';
import {
  ADMIN_SERVICES_IO,
  type AdminRequest,
  type AdminServicesDeps,
  type CreateServiceDto,
  type UpdateServiceDto,
  toCreateServiceInput,
} from './admin-services.dto';

export { ADMIN_SERVICES_IO, type AdminServicesDeps } from './admin-services.dto';

@Controller('admin/services')
@UseFilters(ServicesExceptionFilter)
export class AdminServicesController {
  constructor(@Inject(ADMIN_SERVICES_IO) private readonly deps: AdminServicesDeps) {}

  @Get()
  async list(): Promise<unknown[]> {
    const services = await this.deps.listServices.list();
    const locations = await this.deps.prisma.location.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      services.map(async (s) => ({
        ...s.propsData,
        prices: await this.deps.repo.listForService(s.id),
        locations,
      }))
    );
  }

  @Get('active')
  async listActive(): Promise<unknown[]> {
    const services = await this.deps.listServices.listActive();
    return services.map((s) => s.propsSnapshot);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateServiceDto,
    @Req() request: AdminRequest
  ): Promise<{ id: string }> {
    const result = await this.deps.createService.handle(toCreateServiceInput(dto));
    await this.deps.audit.record({
      actorId: request.adminUserId ?? 'unknown',
      objectType: 'service',
      objectId: result.id,
      before: null,
      after: (await this.deps.listServices.findById(result.id)).propsData,
    });
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Req() request: AdminRequest
  ): Promise<{ id: string }> {
    const previous = await this.deps.listServices.findById(id);
    if (dto.active !== undefined) {
      await this.deps.setServiceActive.handle(id, dto.active);
    }
    const result = await this.deps.updateService.handle({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.parallelDuration !== undefined ? { parallelDuration: dto.parallelDuration } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.faq !== undefined ? { faq: dto.faq } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    });
    const current = await this.deps.listServices.findById(id);
    await this.deps.audit.record({
      actorId: request.adminUserId ?? 'unknown',
      objectType: 'service',
      objectId: id,
      before: previous.propsData,
      after: current.propsData,
    });
    return result;
  }
}
