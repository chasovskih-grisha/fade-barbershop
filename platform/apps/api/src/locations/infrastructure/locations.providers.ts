// Провайдери use cases context locations (окремо від @Module — тримати
// locations.module.ts тонким під max-lines).

import { CreateLocationHandler } from '../application/create-location';
import { UpdateLocationHandler } from '../application/update-location';
import { DisableLocationHandler, EnableLocationHandler } from '../application/set-location-active';
import { ListLocationsHandler } from '../application/list-locations';
import { FindNearestLocationsHandler } from '../application/find-nearest-locations';
import { GetLocationDetailsHandler } from '../application/get-location-details';
import { PrismaLocationRepository } from './prisma-location.repository';
import { PrismaOutboxPublisher } from './prisma-locations-outbox';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { CACHED_ROUTING_GEOCODER } from './locations.geocoder-token';
import { locationLogoProviders } from './location-logo.providers';

const create = {
  provide: CreateLocationHandler,
  useFactory: (...deps: any[]) =>
    new CreateLocationHandler({
      locations: deps[0],
      outbox: deps[1],
      clock: deps[2],
      ids: deps[3],
      uow: deps[4],
    }),
  inject: [
    PrismaLocationRepository,
    PrismaOutboxPublisher,
    SystemClock,
    UuidIdGenerator,
    PrismaUnitOfWork,
  ],
};
const update = {
  provide: UpdateLocationHandler,
  useFactory: (...deps: any[]) =>
    new UpdateLocationHandler({
      locations: deps[0],
      outbox: deps[1],
      clock: deps[2],
      uow: deps[3],
    }),
  inject: [PrismaLocationRepository, PrismaOutboxPublisher, SystemClock, PrismaUnitOfWork],
};
const disable = {
  provide: DisableLocationHandler,
  useFactory: (...deps: any[]) =>
    new DisableLocationHandler({
      locations: deps[0],
      outbox: deps[1],
      clock: deps[2],
      uow: deps[3],
    }),
  inject: [PrismaLocationRepository, PrismaOutboxPublisher, SystemClock, PrismaUnitOfWork],
};
const enable = {
  provide: EnableLocationHandler,
  useFactory: (...deps: any[]) =>
    new EnableLocationHandler({
      locations: deps[0],
      outbox: deps[1],
      clock: deps[2],
      uow: deps[3],
    }),
  inject: [PrismaLocationRepository, PrismaOutboxPublisher, SystemClock, PrismaUnitOfWork],
};
const list = {
  provide: ListLocationsHandler,
  useFactory: (...deps: any[]) => new ListLocationsHandler(deps[0]),
  inject: [PrismaLocationRepository],
};
const nearest = {
  provide: FindNearestLocationsHandler,
  useFactory: (...deps: any[]) => new FindNearestLocationsHandler(deps[0], deps[1]),
  inject: [PrismaLocationRepository, CACHED_ROUTING_GEOCODER],
};
const details = {
  provide: GetLocationDetailsHandler,
  useFactory: (...deps: any[]) => new GetLocationDetailsHandler(deps[0]),
  inject: [PrismaLocationRepository],
};
export const locationUseCaseProviders = [
  create,
  update,
  disable,
  enable,
  list,
  nearest,
  details,
  ...locationLogoProviders,
];
