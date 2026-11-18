import { Body, Controller, Get, Param, Put, UseFilters } from '@nestjs/common';
import { GetSeoBlockUseCase } from '../application/get-seo-block';
import { UpdateSeoBlockUseCase, UpdateSeoBlockDto } from '../application/update-seo-block';
import { ContentExceptionFilter } from './content.exception-filter';

@Controller()
@UseFilters(ContentExceptionFilter)
export class SeoBlockController {
  constructor(
    private readonly getSeoBlock: GetSeoBlockUseCase,
    private readonly updateSeoBlock: UpdateSeoBlockUseCase,
  ) {}

  @Get('content/seo/:entityType/:entityId')
  async getPublic(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.getSeoBlock.execute(entityType, entityId);
  }

  @Get('admin/content/seo/:entityType/:entityId')
  async getAdmin(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.getSeoBlock.execute(entityType, entityId);
  }

  @Put('admin/content/seo/:entityType/:entityId')
  async updateAdmin(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: Omit<UpdateSeoBlockDto, 'entityType' | 'entityId'>,
  ) {
    return this.updateSeoBlock.execute({ ...dto, entityType, entityId });
  }
}
