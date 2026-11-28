// DI-токен і контракт набору хендлерів адмін-CRM (окремо від контролера —
// гейт max-lines на HTTP-поверхні).

import {
  UpdateClientProfileHandler,
  UpdateBirthdayHandler,
  UpdateUsualChairHandler,
  UpdatePreferencesHandler,
  AddNoteHandler,
  RemoveNoteHandler,
  SetVipDiscountHandler,
  SetLoyaltyVisitsHandler,
  GetClientProfileHandler,
  GetClientProfileByUserIdHandler,
  GetClientProfileByPhoneHandler,
  ListClientsHandler,
} from '../application/crm-handlers';

/** DI-токен набору хендлерів адмін-CRM. */
export const ADMIN_CLIENTS_HANDLERS = Symbol('ADMIN_CLIENTS_HANDLERS');

export interface AdminClientsHandlers {
  updateProfile: UpdateClientProfileHandler;
  updateBirthday: UpdateBirthdayHandler;
  updateUsualChair: UpdateUsualChairHandler;
  updatePreferences: UpdatePreferencesHandler;
  addNote: AddNoteHandler;
  removeNote: RemoveNoteHandler;
  setVipDiscount: SetVipDiscountHandler;
  setLoyaltyVisits: SetLoyaltyVisitsHandler;
  getProfile: GetClientProfileHandler;
  getProfileByUserId: GetClientProfileByUserIdHandler;
  getProfileByPhone: GetClientProfileByPhoneHandler;
  listClients: ListClientsHandler;
}
