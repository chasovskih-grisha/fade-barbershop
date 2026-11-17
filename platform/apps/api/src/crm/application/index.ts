// Публічний API use cases crm: реекспорт нового розрізу (один клас = один файл)
// + сумісний barrel `./crm-handlers` для наявних імпортерів (module/controller).
export * from './client-profile-commands';
export * from './client-note-commands';
export * from './client-discount-commands';
export * from './client-queries';
export * from './crm-ports';
export {
  UpdateClientProfileHandler,
  UpdatePreferencesHandler,
  UpdateBirthdayHandler,
} from './client-profile-commands';
export { AddNoteHandler, RemoveNoteHandler } from './client-note-commands';
export { SetVipDiscountHandler, SetLoyaltyVisitsHandler } from './client-discount-commands';
export {
  GetClientProfileHandler,
  GetClientProfileByUserIdHandler,
  GetClientProfileByPhoneHandler,
  ListClientsHandler,
} from './client-queries';
