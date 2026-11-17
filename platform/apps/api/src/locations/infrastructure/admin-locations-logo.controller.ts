// Завантаження/видалення логотипа локації (T-4609a, admin-screens §1.2).
// multipart: поле light — обов'язкове, dark — опційне (on-dark без on-milk
// неможливий — доменна перевірка); alt і variant — текстові поля форми.
// Файли йдуть у публічний бакет location-brand через PublicMediaStorage.
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Put,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DeleteLocationLogoHandler } from '../application/delete-location-logo';
import { SetLocationLogoHandler } from '../application/set-location-logo';
import { InvalidLocationInputError } from '../application/locations-errors';
import { LocationsExceptionFilter } from './locations.exception-filter';
import { toLocationLogoDto } from './admin-locations.dto';
import type { LocationLogoDto } from './admin-locations.dto';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type LogoFiles = { light?: Express.Multer.File[]; dark?: Express.Multer.File[] };

@Controller('admin/locations')
@UseFilters(LocationsExceptionFilter)
export class AdminLocationsLogoController {
  // Імена властивостей свідомо не збігаються з методами маршрутів: властивість
  // перекриває метод на інстансі, і Nest викликає не функцію (500 на запиті).
  constructor(
    private readonly setLogoHandler: SetLocationLogoHandler,
    private readonly deleteLogoHandler: DeleteLocationLogoHandler,
    @Inject(PUBLIC_MEDIA_STORAGE) private readonly media: PublicMediaStorage
  ) {}

  @Put(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'light', maxCount: 1 },
        { name: 'dark', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }
    )
  )
  async putLogo(
    @Param('id') id: string,
    @Body() body: { variant?: string; alt?: string },
    @UploadedFiles() files: LogoFiles = {}
  ): Promise<LocationLogoDto> {
    const light = files.light?.[0];
    if (!light)
      throw new InvalidLocationInputError('Потрібне зображення для світлого поля (light)');
    const dark = files.dark?.[0];
    const logo = await this.setLogoHandler.handle({
      locationId: id,
      variant: body.variant ?? 'lockup',
      alt: body.alt ?? '',
      light: { bytes: light.buffer, contentType: light.mimetype },
      ...(dark ? { dark: { bytes: dark.buffer, contentType: dark.mimetype } } : {}),
    });
    return toLocationLogoDto(logo, this.media);
  }

  @Delete(':id/logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLogo(@Param('id') id: string): Promise<void> {
    await this.deleteLogoHandler.handle(id);
  }
}
