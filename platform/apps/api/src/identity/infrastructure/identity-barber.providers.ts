// Barber staff use-case провайдери (MNG-ADM-05).

import type { Provider } from '@nestjs/common';
import { CreateBarberHandler } from '../application/create-barber';
import { UpdateBarberHandler } from '../application/update-barber';
import { DeactivateBarberHandler, ActivateBarberHandler } from '../application/set-barber-active';
import { ListBarbersHandler } from '../application/list-barbers';
import { SetBarberPhotoHandler } from '../application/set-barber-photo';
import { DeleteBarberPhotoHandler } from '../application/delete-barber-photo';
import { BARBER_PHOTO_REPOSITORY } from '../domain/ports.barber-photo';
import { PrismaBarberPhotoRepository } from '../infrastructure/prisma-barber-photo.repository';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import { S3PublicMediaStorage } from '../../shared/media/s3-public-media-storage';
import { ADMIN_BARBERS_IO } from './admin-barbers.controller';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaUserRepository } from './prisma-adapters';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { useCase, type Deps } from './identity-provider.factory';

const U = PrismaUserRepository;
const O = PrismaOutboxPublisher;
const CLK = SystemClock;
const IDS = UuidIdGenerator;
const UOW = PrismaUnitOfWork;
const PHOTO = PrismaBarberPhotoRepository;
const MEDIA = S3PublicMediaStorage;
const barberMut = [U, O, CLK, UOW] as Deps;

export const identityBarberProviders: Provider[] = [
  { provide: BARBER_PHOTO_REPOSITORY, useClass: PrismaBarberPhotoRepository },
  { provide: PUBLIC_MEDIA_STORAGE, useClass: S3PublicMediaStorage },
  useCase(CreateBarberHandler, [U, O, CLK, IDS, UOW], (d) => ({
    users: d[0],
    outbox: d[1],
    clock: d[2],
    ids: d[3],
    uow: d[4],
  })),
  useCase(UpdateBarberHandler, barberMut, (d) => ({
    users: d[0],
    outbox: d[1],
    clock: d[2],
    uow: d[3],
  })),
  useCase(DeactivateBarberHandler, barberMut, (d) => ({
    users: d[0],
    outbox: d[1],
    clock: d[2],
    uow: d[3],
  })),
  useCase(ActivateBarberHandler, barberMut, (d) => ({
    users: d[0],
    outbox: d[1],
    clock: d[2],
    uow: d[3],
  })),
  useCase(SetBarberPhotoHandler, [U, PHOTO, MEDIA, CLK], (d) => ({
    users: d[0],
    photos: d[1],
    media: d[2],
    clock: d[3],
  })),
  useCase(DeleteBarberPhotoHandler, [U, PHOTO, MEDIA], (d) => ({
    users: d[0],
    photos: d[1],
    media: d[2],
  })),
  {
    provide: ListBarbersHandler,
    useFactory: (users: PrismaUserRepository) => new ListBarbersHandler(users),
    inject: [U],
  },
  {
    provide: ADMIN_BARBERS_IO,
    useFactory: (...deps: never[]) => ({
      create: deps[0],
      update: deps[1],
      deactivate: deps[2],
      activate: deps[3],
      list: deps[4],
      setPhoto: deps[5],
      deletePhoto: deps[6],
      photos: deps[7],
      media: deps[8],
    }),
    inject: [
      CreateBarberHandler,
      UpdateBarberHandler,
      DeactivateBarberHandler,
      ActivateBarberHandler,
      ListBarbersHandler,
      SetBarberPhotoHandler,
      DeleteBarberPhotoHandler,
      BARBER_PHOTO_REPOSITORY,
      PUBLIC_MEDIA_STORAGE,
    ],
  },
];
