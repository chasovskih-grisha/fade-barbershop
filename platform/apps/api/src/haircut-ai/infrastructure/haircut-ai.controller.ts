// Прийом референсного фото у флоу запису (T-043, REF-WEB-01/05) — multipart,
// multer memoryStorage: файл у пам'яті до 10 МБ, валідація/збереження — в
// UploadPhoto (ADR 0008 §2, ліміти ADR 0015 §1).
//
// Власник — з web-сесії, якщо вона є; інакше 'anonymous': публічний booking-флоу
// (T-041) дозволяє записатися гостю. Фото гостя не потрапляє в кабінет — воно
// лише референс для барбера. ownerId з тіла запиту НЕ приймається (security).

import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { ANONYMOUS_OWNER } from '../application/upload-photo.use-case';
import { InvalidPhotoError } from '../application/photo-errors';
import { ReferencePhotoNotFoundError } from '../application/get-reference-photo-url';
import { HaircutAiHandlers } from './haircut-ai-handlers';
import { webClientId } from '../../scheduling/infrastructure/client-web-session';
import { PrismaService } from '../../shared/prisma/prisma.service';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@ApiTags('booking')
@Controller('booking')
export class HaircutAiController {
  constructor(
    private readonly handlers: HaircutAiHandlers,
    private readonly prisma: PrismaService
  ) {}

  @Post('reference-photos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } })
  )
  async upload(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File | undefined
  ): Promise<{ photoId: string; objectKey: string; ownerId: string }> {
    if (!file) throw new HttpException('Файл не передано (поле file)', HttpStatus.BAD_REQUEST);
    const ownerId = (await webClientId(req, this.prisma, false)) ?? ANONYMOUS_OWNER;
    try {
      const result = await this.handlers.useCases.uploadPhoto.execute({
        bytes: new Uint8Array(file.buffer),
        contentType: file.mimetype,
        ownerId,
      });
      return { ...result, ownerId };
    } catch (e) {
      if (e instanceof InvalidPhotoError)
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      throw e;
    }
  }

  // Підписаний URL референсного фото (REF-WEB-03, ADR 0008 §2). Сесія
  // обов'язкова: фото гостя (ownerId = 'anonymous') належить усім гостям
  // одночасно, тож віддавати його за id означало б витік фото з обличчям.
  @Get('reference-photos/:id')
  async getReferencePhoto(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<{ url: string; contentType: string; expiresInSeconds: number }> {
    const actorId = await webClientId(req, this.prisma, true);
    try {
      return await this.handlers.useCases.referencePhotoUrl.execute({ photoId: id, actorId });
    } catch (e) {
      if (e instanceof ReferencePhotoNotFoundError)
        throw new HttpException('Фото не знайдено', HttpStatus.NOT_FOUND);
      throw e;
    }
  }

  // Підписаний URL референсного фото для картки візиту в адмінці (REF-BARBER,
  // T-043). Охороняється глобальним AdminSessionGuard (APP_GUARD на /admin/*),
  // тож право дає роль, а не володіння фото — інакше барбер призначеного
  // візиту не побачив би референс гостя (ownerId 'anonymous').
  @Get('admin/reference-photos/:id')
  async getAdminReferencePhoto(
    @Param('id') id: string
  ): Promise<{ url: string; contentType: string; expiresInSeconds: number }> {
    try {
      return await this.handlers.useCases.adminReferencePhotoUrl.execute({ photoId: id });
    } catch (e) {
      if (e instanceof ReferencePhotoNotFoundError)
        throw new HttpException('Фото не знайдено', HttpStatus.NOT_FOUND);
      throw e;
    }
  }
}
