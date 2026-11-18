import { Module } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../shared/prisma/prisma-context';
import { PrismaClientProfileRepository } from './infrastructure/prisma-client-profile.repository';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { AdminClientsController, ADMIN_CLIENTS_HANDLERS } from './infrastructure/admin-clients.controller';
import { AdminClientNotesController } from './infrastructure/admin-client-notes.controller';
import { AdminClientList, CLIENT_LIST_CLOCK } from './application/admin-client-list';
import { PrismaClientListReader } from './infrastructure/prisma-client-list.reader';
import { CLIENT_LIST_READER } from './application/client-list-reader';
import { RecordVisitHandler } from './application/record-visit.use-case';
import { PrismaVisitRepository } from './infrastructure/prisma-visit.repository';
import { PrismaVisitClientLookup } from './infrastructure/prisma-visit-client.lookup';
import { UpdateClientProfileHandler, UpdateBirthdayHandler, UpdatePreferencesHandler, AddNoteHandler, RemoveNoteHandler, SetVipDiscountHandler, SetLoyaltyVisitsHandler, GetClientProfileHandler, GetClientProfileByUserIdHandler, GetClientProfileByPhoneHandler, ListClientsHandler } from './application/crm-handlers';

// Команди отримують спільний CrmCommandContext (bundle), запити — лише порт;
// набір хендлерів контролера збирається однією фабрикою (гейт max-params).
const ADMIN_CLIENTS_HANDLERS_PROVIDER = {
  provide: ADMIN_CLIENTS_HANDLERS,
  useFactory: (...deps: any[]) => {
    const commands = {
      profiles: deps[0],
      outbox: deps[1],
      clock: deps[2],
      ids: deps[3],
      uow: deps[4],
    };
    return {
      updateProfile: new UpdateClientProfileHandler(commands),
      updateBirthday: new UpdateBirthdayHandler(commands),
      updatePreferences: new UpdatePreferencesHandler(commands),
      addNote: new AddNoteHandler(commands),
      removeNote: new RemoveNoteHandler(commands),
      setVipDiscount: new SetVipDiscountHandler(commands),
      setLoyaltyVisits: new SetLoyaltyVisitsHandler(commands),
      getProfile: new GetClientProfileHandler(deps[0]),
      getProfileByUserId: new GetClientProfileByUserIdHandler(deps[0]),
      getProfileByPhone: new GetClientProfileByPhoneHandler(deps[0]),
      listClients: new ListClientsHandler(deps[0]),
    };
  },
  inject: [
    PrismaClientProfileRepository,
    PrismaOutboxPublisher,
    SystemClock,
    UuidIdGenerator,
    PrismaUnitOfWork,
  ],
};

@Module({
  controllers: [AdminClientsController, AdminClientNotesController],
  providers: [
    PrismaService,
    PrismaUnitOfWork,
    SystemClock,
    UuidIdGenerator,
    PrismaOutboxPublisher,
    PrismaClientProfileRepository,
    ADMIN_CLIENTS_HANDLERS_PROVIDER,
    AdminClientList,
    { provide: CLIENT_LIST_READER, useClass: PrismaClientListReader },
    // Вікно підсумків (T-4606b) рахує той самий годинник, що й команди crm.
    { provide: CLIENT_LIST_CLOCK, useExisting: SystemClock },
    // Проєкція історії візитів (T-061): подія scheduling → факт Visit.
    PrismaVisitRepository,
    PrismaVisitClientLookup,
    {
      provide: RecordVisitHandler,
      useFactory: (visits: PrismaVisitRepository, clients: PrismaVisitClientLookup) =>
        new RecordVisitHandler({ visits, clients }),
      inject: [PrismaVisitRepository, PrismaVisitClientLookup],
    },
  ],
  // Токен експортуємо: ClientProfileController збирається в IdentityModule
  // (окрема модульна мережа), тож без export'а він не резолвиться.
  exports: [PrismaClientProfileRepository, ADMIN_CLIENTS_HANDLERS],
})
export class CrmModule {}
