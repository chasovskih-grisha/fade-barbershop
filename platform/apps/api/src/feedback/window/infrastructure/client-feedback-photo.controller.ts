// Клієнтські маршрути фото відгуку (T-150a): завантаження, показ через
// підписаний URL і видалення відгуку до кінця вікна. Користувач — лише з сесії.
import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../../identity/infrastructure/client-session.guard';
import { FeedbackPhotoService } from '../application/feedback-photo.service';
import { FeedbackPhotoRemovalService } from '../application/feedback-photo-removal.service';
import { toFeedbackPhotoHttp } from './feedback-photo-http.mapper';

export type AddFeedbackPhotoDto = { contentType?: unknown; base64?: unknown };

@Controller('feedback/window')
export class ClientFeedbackPhotoController {
  constructor(
    private readonly photos: FeedbackPhotoService,
    private readonly removal: FeedbackPhotoRemovalService
  ) {}

  @Post(':appointmentId/photos')
  @UseGuards(ClientSessionGuard)
  async upload(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: AddFeedbackPhotoDto
  ) {
    const session = clientSessionOf(req);
    try {
      return await this.photos.addPhoto({
        appointmentId,
        userId: session!.userId,
        contentType: String(dto?.contentType ?? ''),
        bytes: Buffer.from(String(dto?.base64 ?? ''), 'base64'),
      });
    } catch (error) {
      throw toFeedbackPhotoHttp(error);
    }
  }

  @Get(':appointmentId/photos/:photoId')
  @UseGuards(ClientSessionGuard)
  async url(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Param('photoId') photoId: string
  ) {
    const session = clientSessionOf(req);
    try {
      return await this.photos.urlFor({ appointmentId, userId: session!.userId, photoId });
    } catch (error) {
      throw toFeedbackPhotoHttp(error);
    }
  }

  @Delete(':appointmentId/photos/:photoId')
  @UseGuards(ClientSessionGuard)
  async removePhoto(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Param('photoId') photoId: string
  ) {
    const session = clientSessionOf(req);
    try {
      return await this.removal.removePhoto({ appointmentId, userId: session!.userId, photoId });
    } catch (error) {
      throw toFeedbackPhotoHttp(error);
    }
  }

  @Delete(':appointmentId/review')
  @UseGuards(ClientSessionGuard)
  async removeReview(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const session = clientSessionOf(req);
    try {
      return await this.removal.removeReview({ appointmentId, userId: session!.userId });
    } catch (error) {
      throw toFeedbackPhotoHttp(error);
    }
  }
}
