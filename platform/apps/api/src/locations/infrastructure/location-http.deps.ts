// Один аргумент конструктора контролера: Nest збирає залежності у фабриці,
// бо eslint max-params рахує параметри конструктора, а DI читає inject[].
import { CreateLocationHandler } from '../application/create-location';
import { UpdateLocationHandler } from '../application/update-location';
import { ListLocationsHandler } from '../application/list-locations';
import { FindNearestLocationsHandler } from '../application/find-nearest-locations';
import { GetLocationDetailsHandler } from '../application/get-location-details';
import { PrismaLocationLogoRepository } from './prisma-location-logo.repository';
import { PUBLIC_MEDIA_STORAGE } from '../../shared/media/public-media-storage';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

export const PUBLIC_LOCATION_DEPS = Symbol('PUBLIC_LOCATION_DEPS');
export const ADMIN_LOCATION_DEPS = Symbol('ADMIN_LOCATION_DEPS');

export interface PublicLocationDeps {
  list: ListLocationsHandler;
  nearest: FindNearestLocationsHandler;
  details: GetLocationDetailsHandler;
  logos: PrismaLocationLogoRepository;
  media: PublicMediaStorage;
}

export interface AdminLocationDeps {
  create: CreateLocationHandler;
  update: UpdateLocationHandler;
  list: ListLocationsHandler;
  logos: PrismaLocationLogoRepository;
  media: PublicMediaStorage;
}

export function publicLocationDeps(
  ...deps: [
    ListLocationsHandler,
    FindNearestLocationsHandler,
    GetLocationDetailsHandler,
    PrismaLocationLogoRepository,
    PublicMediaStorage,
  ]
): PublicLocationDeps {
  const [list, nearest, details, logos, media] = deps;
  return { list, nearest, details, logos, media };
}

export function adminLocationDeps(
  ...deps: [
    CreateLocationHandler,
    UpdateLocationHandler,
    ListLocationsHandler,
    PrismaLocationLogoRepository,
    PublicMediaStorage,
  ]
): AdminLocationDeps {
  const [create, update, list, logos, media] = deps;
  return { create, update, list, logos, media };
}

export const locationHttpProviders = [
  {
    provide: PUBLIC_LOCATION_DEPS,
    useFactory: publicLocationDeps,
    inject: [
      ListLocationsHandler,
      FindNearestLocationsHandler,
      GetLocationDetailsHandler,
      PrismaLocationLogoRepository,
      PUBLIC_MEDIA_STORAGE,
    ],
  },
  {
    provide: ADMIN_LOCATION_DEPS,
    useFactory: adminLocationDeps,
    inject: [
      CreateLocationHandler,
      UpdateLocationHandler,
      ListLocationsHandler,
      PrismaLocationLogoRepository,
      PUBLIC_MEDIA_STORAGE,
    ],
  },
];
