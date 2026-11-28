// Сумісний barrel use cases crm (розріз — в index.ts): існуючі імпортери
// (crm.module.ts, admin-clients.controller.ts) читають звідси. Класи
// конструюються з CrmCommandContext (bundle) або портом репозиторію.
export * from './index';
export type {
  UpdateClientProfileInput,
  UpdateClientProfileOutput,
  UpdateBirthdayInput,
  UpdateBirthdayOutput,
  UpdateUsualChairInput,
  UpdateUsualChairOutput,
  UpdatePreferencesInput,
  UpdatePreferencesOutput,
} from './client-profile-commands';
export type {
  AddNoteInput,
  AddNoteOutput,
  RemoveNoteInput,
  RemoveNoteOutput,
} from './client-note-commands';
export type {
  SetVipDiscountInput,
  SetVipDiscountOutput,
  SetLoyaltyVisitsInput,
  SetLoyaltyVisitsOutput,
} from './client-discount-commands';
export type {
  GetClientProfileInput,
  GetClientProfileOutput,
  GetClientProfileByUserIdInput,
  GetClientProfileByUserIdOutput,
  GetClientProfileByPhoneInput,
  GetClientProfileByPhoneOutput,
  ListClientsInput,
  ListClientsOutput,
} from './client-queries';
