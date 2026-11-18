import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { BarberPhoto } from '../domain/barber-photo';
import type { BarberPhotoRepository } from '../domain/ports.barber-photo';

type PhotoRow = {
  userId: string;
  objectKey: string;
  alt: string;
  width: number | null;
  height: number | null;
  consentAt: Date | null;
  consentBy: string | null;
  updatedAt: Date;
};

const toDomain = (row: PhotoRow): BarberPhoto => ({
  userId: row.userId,
  objectKey: row.objectKey,
  alt: row.alt,
  width: row.width,
  height: row.height,
  consentAt: row.consentAt,
  consentBy: row.consentBy,
  updatedAt: row.updatedAt,
});

@Injectable()
export class PrismaBarberPhotoRepository implements BarberPhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<BarberPhoto | null> {
    const row = await this.prisma.barberPhoto.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
  }

  async save(photo: BarberPhoto): Promise<void> {
    const data = {
      objectKey: photo.objectKey,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      consentAt: photo.consentAt,
      consentBy: photo.consentBy,
    };
    await this.prisma.barberPhoto.upsert({
      where: { userId: photo.userId },
      create: { id: uuidv7(), userId: photo.userId, ...data },
      update: data,
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.barberPhoto.deleteMany({ where: { userId } });
  }
}
