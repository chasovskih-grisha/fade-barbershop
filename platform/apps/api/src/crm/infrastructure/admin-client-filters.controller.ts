// T-4461: збережені CRM-фільтри — HTTP-поверхня адмінки.
// Окремий контролер (не AdminClientsController), щоб `GET :clientId` не
// перехоплював `/filters`. Власник передається явно (`ownerId`), як і
// `changedBy` у сусідніх ендпоінтах crm: сесійна авторизація адмінки ще
// не введена (T-4486/T-4566).
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CrmExceptionFilter } from './crm.exception-filter';
import {
  SavedClientFilterService,
  type SavedFilterRunResult,
} from '../application/saved-client-filter.service';
import type { SavedClientFilter } from '../domain/saved-client-filter';

function toDto(filter: SavedClientFilter) {
  return {
    id: filter.id,
    ownerId: filter.ownerId,
    name: filter.name,
    query: filter.query,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
  };
}

@Controller('admin/client-filters')
@UseFilters(CrmExceptionFilter)
export class AdminClientFiltersController {
  constructor(private readonly filters: SavedClientFilterService) {}

  /** Створити фільтр («зберегти як») із поточних параметрів списку. */
  @Post()
  async create(
    @Body() body: { ownerId: string; name: string; query: Record<string, string | undefined> }
  ) {
    const filter = await this.filters.create({
      ownerId: body.ownerId,
      name: body.name,
      query: body.query ?? {},
    });
    return toDto(filter);
  }

  /** Список збережених фільтрів власника. */
  @Get()
  async list(@Query('ownerId') ownerId: string) {
    const items = await this.filters.list(ownerId ?? '');
    return { items, total: items.length };
  }

  /** Один фільтр (чужий → 404). */
  @Get(':id')
  async get(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return toDto(await this.filters.get(id, ownerId ?? ''));
  }

  /** Перейменування. */
  @Patch(':id')
  async rename(
    @Param('id') id: string,
    @Body() body: { ownerId: string; name: string }
  ) {
    return toDto(await this.filters.rename(id, body.ownerId, body.name));
  }

  /** Оновлення запиту фільтра. */
  @Patch(':id/query')
  async updateQuery(
    @Param('id') id: string,
    @Body() body: { ownerId: string; query: Record<string, string | undefined> }
  ) {
    return toDto(await this.filters.updateQuery(id, body.ownerId, body.query ?? {}));
  }

  /** Видалення. */
  @Delete(':id')
  async remove(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return this.filters.remove(id, ownerId ?? '');
  }

  /** Повторне виконання однією дією: свіже читання, той самий запит. */
  @Post(':id/run')
  async run(
    @Param('id') id: string,
    @Body() body: { ownerId: string; page?: number }
  ): Promise<SavedFilterRunResult> {
    return this.filters.run(id, body.ownerId, body.page === undefined ? {} : { page: body.page });
  }
}
