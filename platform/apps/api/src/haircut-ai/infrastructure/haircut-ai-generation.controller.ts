// Контролер AI-генерації haircut-ai (T-050/051/052, ADR 0008). Власник фото/
// генерації — ЗАВЖДИ з web-сесії (ADR 0017), ніколи з тіла запиту: інакше
// клієнт керував би чужими фото. Гість сюди не доходить — 401. Маршрути:
// assets, generations (+ статус, select-variant), photos consent та видалення
// (AI-WEB-01..07, REF-WEB-02/03).
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { HaircutExceptionFilter } from './haircut-exception.filter';
import { HaircutAiHandlers } from './haircut-ai-handlers';
import { webClientId } from '../../scheduling/infrastructure/client-web-session';
import { PrismaService } from '../../shared/prisma/prisma.service';

@ApiTags('haircut-ai')
@Controller('haircut-ai')
@UseFilters(HaircutExceptionFilter)
export class HaircutAiGenerationController {
  constructor(
    private readonly handlers: HaircutAiHandlers,
    private readonly prisma: PrismaService
  ) {}

  /** GET /haircut-ai/assets — фото + генерації клієнта для кабінту (REF-WEB-03). */
  @Get('assets')
  assets(@Req() req: Request) {
    return this.send(req, (o) => this.handlers.useCases.listMyAi.handle(o));
  }

  @Post('generations')
  @HttpCode(HttpStatus.CREATED)
  request(@Req() req: Request, @Body() body: { sourcePhotoId: string; variantCount?: number }) {
    return this.send(req, (o) =>
      this.handlers.useCases.requestSuggestion.handle({
        sourcePhotoId: body.sourcePhotoId,
        ownerId: o,
        ...(body.variantCount === undefined ? {} : { variantCount: body.variantCount }),
      })
    );
  }

  @Get('generations/:id')
  status(@Req() req: Request, @Param('id') id: string) {
    // prettier-ignore
    return this.send(req, (o) => this.handlers.useCases.getStatus.handle({ suggestionId: id, ownerId: o }));
  }

  @Post('generations/:id/select-variant')
  @HttpCode(HttpStatus.OK)
  select(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { variantObjectKey: string; appointmentId?: string }
  ) {
    // prettier-ignore
    return this.send(req, (o) => this.handlers.useCases.selectVariant.handle({ suggestionId: id, ownerId: o, variantObjectKey: body.variantObjectKey, ...(body.appointmentId === undefined ? {} : { appointmentId: body.appointmentId }) }));
  }

  @Patch('photos/:id/consent')
  @HttpCode(HttpStatus.OK)
  giveConsent(@Req() req: Request, @Param('id') id: string) {
    // prettier-ignore
    return this.send(req, (o) => this.handlers.useCases.giveConsent.handle({ sourcePhotoId: id, ownerId: o }));
  }

  @Delete('photos/:id/consent')
  @HttpCode(HttpStatus.OK)
  revokeConsent(@Req() req: Request, @Param('id') id: string) {
    // prettier-ignore
    return this.send(req, (o) => this.handlers.useCases.revokeConsent.handle({ sourcePhotoId: id, ownerId: o }));
  }

  @Delete('photos/:id')
  @HttpCode(HttpStatus.OK)
  delete(@Req() req: Request, @Param('id') id: string) {
    // prettier-ignore
    return this.send(req, (o) => this.handlers.useCases.deletePhoto.handle({ sourcePhotoId: id, ownerId: o }));
  }

  /** Виклик use case з ownerId web-сесії. */
  private send(req: Request, call: (ownerId: string) => Promise<unknown>): Promise<unknown> {
    return webClientId(req, this.prisma, true).then(call);
  }
}
