/* eslint-disable max-lines, max-params -- cohesive module (121 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Admin barbers CRUD — MNG-ADM-05. Барбер = User з роллю `barber`.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateBarberHandler, type CreateBarberInput } from '../application/create-barber';
import { UpdateBarberHandler, type UpdateBarberInput } from '../application/update-barber';
import { ActivateBarberHandler, DeactivateBarberHandler } from '../application/set-barber-active';
import { ListBarbersHandler } from '../application/list-barbers';
import { SetBarberPhotoHandler } from '../application/set-barber-photo';
import { DeleteBarberPhotoHandler } from '../application/delete-barber-photo';
import { type BarberPhotoRepository } from '../domain/ports.barber-photo';
import { type PublicMediaStorage } from '../../shared/media/public-media-storage';
import { IdentityExceptionFilter } from './identity.exception-filter';
import {
  toBarberDto,
  type BarberDto,
  type CreateBarberDto,
  type UpdateBarberDto,
  type BarberPhotoDto,
} from './admin-barbers.dto';
import { InvalidBarberInputError } from '../application/barber-errors';

export type { BarberDto, CreateBarberDto, UpdateBarberDto, BarberPhotoDto };

export const ADMIN_BARBERS_IO = Symbol('ADMIN_BARBERS_IO');

export interface AdminBarbersDeps {
  create: CreateBarberHandler;
  update: UpdateBarberHandler;
  deactivate: DeactivateBarberHandler;
  activate: ActivateBarberHandler;
  list: ListBarbersHandler;
  setPhoto: SetBarberPhotoHandler;
  deletePhoto: DeleteBarberPhotoHandler;
  photos: BarberPhotoRepository;
  media: PublicMediaStorage;
}

@Controller('admin/barbers')
@UseFilters(IdentityExceptionFilter)
export class AdminBarbersController {
  constructor(@Inject(ADMIN_BARBERS_IO) private readonly deps: AdminBarbersDeps) {}

  @Get()
  async listAll(): Promise<BarberDto[]> {
    const barbers = await this.deps.list.list();
    const photos = await Promise.all(barbers.map((b) => this.deps.photos.findByUserId(b.id)));
    return barbers.map((b, i) => toBarberDto(b, photos[i], this.deps.media));
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<BarberDto> {
    const barber = await this.deps.list.findById(id);
    const photo = await this.deps.photos.findByUserId(id);
    return toBarberDto(barber, photo, this.deps.media);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBarber(@Body() dto: CreateBarberDto): Promise<{ id: string }> {
    const input: CreateBarberInput = { name: dto.name, phone: dto.phone };
    return this.deps.create.handle(input);
  }

  @Patch(':id')
  async updateBarber(
    @Param('id') id: string,
    @Body() dto: UpdateBarberDto
  ): Promise<{ id: string }> {
    const input: UpdateBarberInput = { id, ...dto };
    return this.deps.update.handle(input);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateBarber(@Param('id') id: string): Promise<{ id: string }> {
    return this.deps.deactivate.handle(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activateBarber(@Param('id') id: string): Promise<{ id: string }> {
    return this.deps.activate.handle(id);
  }

  @Put(':id/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  )
  async putPhoto(
    @Param('id') id: string,
    @Body() body: { alt?: string; consent?: string | boolean },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any
  ): Promise<BarberPhotoDto | null> {
    if (!file) throw new InvalidBarberInputError('Потрібне зображення');
    const consent = body.consent === true || body.consent === 'true';
    const adminIdentifier = req.admin?.username ?? req.admin?.id ?? 'admin';
    const photo = await this.deps.setPhoto.handle({
      userId: id,
      alt: body.alt ?? '',
      consent,
      adminIdentifier,
      file: { bytes: file.buffer, contentType: file.mimetype },
    });
    return toBarberDto(await this.deps.list.findById(id), photo, this.deps.media).photo;
  }

  @Delete(':id/photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(@Param('id') id: string): Promise<void> {
    await this.deps.deletePhoto.handle(id);
  }
}
