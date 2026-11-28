import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaServiceRepository } from './prisma-service.repository';
import { AdminServicesController, ADMIN_SERVICES_IO } from './admin-services.controller';
import { AdminServicesPricesController } from './admin-services-prices.controller';
import { AdminProductsController } from './admin-products.controller';
import { PrismaProductRepository } from './prisma-product.repository';
import { CreateServiceHandler } from '../application/create-service';
import { UpdateServiceHandler } from '../application/update-service';
import { SetServiceActiveHandler } from '../application/set-service-active';
import { ListServicesHandler } from '../application/list-services';
import { ClientServiceBookingsController } from './public-services.controller';
import { RevenueOptimizationController } from './revenue-optimization.controller';
import { ServicesReader } from './public-services.reader';
import { PrismaCatalogAuditRepository } from './prisma-catalog-audit.repository';
import { PublicRecommendedServicesController } from './public-recommended-services.controller';
import { AdminRecommendedServicesController } from './admin-recommended-services.controller';
import { RECOMMENDED_PROVIDERS } from './recommended.providers';

const adminServicesIO = {
  provide: ADMIN_SERVICES_IO,
  useFactory: (...deps: any[]) => ({
    createService: deps[0],
    updateService: deps[1],
    setServiceActive: deps[2],
    listServices: deps[3],
    prisma: deps[4],
    repo: deps[5],
    audit: deps[6],
  }),
  inject: [
    CreateServiceHandler,
    UpdateServiceHandler,
    SetServiceActiveHandler,
    ListServicesHandler,
    PrismaService,
    PrismaServiceRepository,
    PrismaCatalogAuditRepository,
  ],
};

@Module({
  controllers: [
    AdminServicesController,
    AdminServicesPricesController,
    AdminProductsController,
    ClientServiceBookingsController,
    RevenueOptimizationController,
    PublicRecommendedServicesController,
    AdminRecommendedServicesController,
  ],
  providers: [
    PrismaService,
    PrismaServiceRepository,
    PrismaProductRepository,
    PrismaCatalogAuditRepository,
    ServicesReader,
    adminServicesIO,
    ...RECOMMENDED_PROVIDERS,
    {
      provide: CreateServiceHandler,
      useFactory: (repo: PrismaServiceRepository) => new CreateServiceHandler(repo),
      inject: [PrismaServiceRepository],
    },
    {
      provide: UpdateServiceHandler,
      useFactory: (repo: PrismaServiceRepository) => new UpdateServiceHandler(repo),
      inject: [PrismaServiceRepository],
    },
    {
      provide: SetServiceActiveHandler,
      useFactory: (repo: PrismaServiceRepository) => new SetServiceActiveHandler(repo),
      inject: [PrismaServiceRepository],
    },
    {
      provide: ListServicesHandler,
      useFactory: (repo: PrismaServiceRepository) => new ListServicesHandler(repo),
      inject: [PrismaServiceRepository],
    },
  ],
  exports: [
    PrismaServiceRepository,
    PrismaProductRepository,
    ServicesReader,
    ...RECOMMENDED_PROVIDERS,
  ],
})
export class ServicesModule {}
