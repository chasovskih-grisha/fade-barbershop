// T-4455: HTTP-поверхня портфоліо барбера.
// Барбер додає фото «до/після» зі свого пристрою, фіксує згоду клієнта й
// бачить статуси; адмін модерує (публікація/приховування); відкликання згоди
// ховає елемент негайно. Роль передається тілом запиту — автентифікація
// барбер-додатка підключається окремим гардом (див. картку, Deferred).
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PortfolioService,
  type PortfolioPhotoInput,
  type PortfolioView,
} from '../application/portfolio.service';
import {
  PortfolioConflictError,
  PortfolioError,
  PortfolioForbiddenError,
  type ClientConsent,
  type PortfolioActorRole,
  type PublicationStatus,
} from '../domain/portfolio-item';

function mapError(error: unknown): never {
  if (error instanceof PortfolioForbiddenError) throw new ForbiddenException(error.message);
  if (error instanceof PortfolioConflictError) throw new ConflictException(error.message);
  if (error instanceof PortfolioError) {
    if (error.message.includes('not found')) throw new NotFoundException(error.message);
    throw new BadRequestException(error.message);
  }
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

function roleOf(value: string | undefined): PortfolioActorRole {
  if (value === 'barber' || value === 'admin' || value === 'client') return value;
  throw new BadRequestException(`Unknown actor role: ${value ?? 'missing'}`);
}

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}

interface AddPortfolioBody {
  actorId: string;
  actorRole?: string;
  barberId?: string;
  category: string;
  caption?: string | null;
  tags?: string[];
  before?: PortfolioPhotoInput | null;
  after: PortfolioPhotoInput[];
  consent?: { opinion: ClientConsent['opinion']; obtainedVia: ClientConsent['obtainedVia'] };
  at?: string;
}

@ApiTags('portfolio')
@Controller('barber/portfolio')
export class BarberPortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Додати фото «до/після» зі свого пристрою' })
  async add(@Body() body: AddPortfolioBody): Promise<PortfolioView> {
    try {
      return await this.portfolio.addByBarber({
        actorId: body.actorId,
        actorRole: roleOf(body.actorRole),
        ...(body.barberId ? { barberId: body.barberId } : {}),
        category: body.category,
        ...(body.caption === undefined ? {} : { caption: body.caption }),
        ...(body.tags ? { tags: body.tags } : {}),
        ...(body.before ? { before: body.before } : {}),
        after: body.after ?? [],
        ...(body.consent ? { consent: body.consent } : {}),
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Get(':barberId')
  @ApiOperation({ summary: 'Мої елементи зі статусами модерації' })
  async list(@Param('barberId') barberId: string): Promise<PortfolioView[]> {
    try {
      return await this.portfolio.listForBarber(barberId);
    } catch (error) {
      mapError(error);
    }
  }

  @Post(':id/consent')
  @ApiOperation({ summary: 'Зафіксувати згоду клієнта (opt-in екран або в кріслі)' })
  async consent(
    @Param('id') id: string,
    @Body()
    body: {
      actorId: string;
      actorRole?: string;
      opinion: ClientConsent['opinion'];
      obtainedVia: ClientConsent['obtainedVia'];
      at?: string;
    }
  ): Promise<PortfolioView> {
    try {
      return await this.portfolio.recordConsent(id, {
        actorId: body.actorId,
        actorRole: roleOf(body.actorRole ?? 'barber'),
        opinion: body.opinion,
        obtainedVia: body.obtainedVia,
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }
}

@ApiTags('portfolio')
@Controller('portfolio')
export class PublicPortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('barbers/:barberId')
  @ApiOperation({ summary: 'Опублікована галерея барбера' })
  async gallery(@Param('barberId') barberId: string): Promise<PortfolioView[]> {
    try {
      return await this.portfolio.publicGallery(barberId);
    } catch (error) {
      mapError(error);
    }
  }

  @Post(':id/consent/revoke')
  @ApiOperation({ summary: 'Відкликати згоду — елемент ховається негайно' })
  async revoke(
    @Param('id') id: string,
    @Body() body: { by: string; at?: string }
  ): Promise<PortfolioView> {
    try {
      return await this.portfolio.revokeConsent(id, {
        by: body.by ?? '',
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }
}

@ApiTags('admin-portfolio')
@Controller('admin/portfolio')
export class AdminPortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Черга модерації або вся дошка' })
  async list(@Query('status') status?: string): Promise<PortfolioView[]> {
    try {
      return await this.portfolio.listForAdmin(status as PublicationStatus | undefined);
    } catch (error) {
      mapError(error);
    }
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Опублікувати: лише адмін і лише за згодою клієнта' })
  async publish(
    @Param('id') id: string,
    @Body() body: { by: string; role?: string; at?: string }
  ): Promise<PortfolioView> {
    try {
      return await this.portfolio.publish(id, {
        by: body.by ?? '',
        role: roleOf(body.role ?? 'admin'),
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Post(':id/hide')
  @ApiOperation({ summary: 'Приховати елемент з дошки (причина обов’язкова)' })
  async hide(
    @Param('id') id: string,
    @Body() body: { by: string; role?: string; reason: string; at?: string }
  ): Promise<PortfolioView> {
    try {
      return await this.portfolio.hide(id, {
        by: body.by ?? '',
        role: roleOf(body.role ?? 'admin'),
        reason: body.reason ?? '',
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Get(':id/consent-journal')
  @ApiOperation({ summary: 'Журнал згоди елемента (хто/коли/як)' })
  journal(@Param('id') id: string): ReturnType<PortfolioService['consentJournal']> {
    return this.portfolio.consentJournal(id);
  }
}
