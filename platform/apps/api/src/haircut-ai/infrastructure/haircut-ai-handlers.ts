// Бандл use cases для DI: контролери отримують один об'єкт замість десятка
// аргументів (гейт max-params ≤ 3) — конвенція crm/locations, де контролери
// теж приймають бандл. Типи не ераніться: структурна сумісність із портами.

import { UploadPhoto } from '../application/upload-photo.use-case';
import { RequestSuggestionHandler } from '../application/request-suggestion';
import { GetSuggestionStatusHandler } from '../application/get-suggestion-status';
import { SelectVariantHandler } from '../application/select-variant';
import { GiveConsentHandler, RevokeConsentHandler } from '../application/manage-consent';
import { DeletePhotoHandler } from '../application/delete-photo';
import { ListMyAiHandler } from '../application/list-my-ai';
import { GetReferencePhotoUrl } from '../application/get-reference-photo-url';
import { GetAdminReferencePhotoUrl } from '../application/get-admin-reference-photo-url';

export interface HaircutAiUseCases {
  uploadPhoto: UploadPhoto;
  requestSuggestion: RequestSuggestionHandler;
  getStatus: GetSuggestionStatusHandler;
  selectVariant: SelectVariantHandler;
  giveConsent: GiveConsentHandler;
  revokeConsent: RevokeConsentHandler;
  deletePhoto: DeletePhotoHandler;
  listMyAi: ListMyAiHandler;
  referencePhotoUrl: GetReferencePhotoUrl;
  adminReferencePhotoUrl: GetAdminReferencePhotoUrl;
}

/** Значення-бандл: useFactory-ів у providers складають його з use cases. */
export class HaircutAiHandlers {
  constructor(readonly useCases: HaircutAiUseCases) {}
}

/** Порядок use cases у DI-бандлі (див. haircut-ai-use-case.providers.ts). */
export type HaircutAiUseCaseList = [
  UploadPhoto,
  RequestSuggestionHandler,
  GetSuggestionStatusHandler,
  SelectVariantHandler,
  GiveConsentHandler,
  RevokeConsentHandler,
  DeletePhotoHandler,
  ListMyAiHandler,
  GetReferencePhotoUrl,
  GetAdminReferencePhotoUrl,
];

export function toUseCases(...list: HaircutAiUseCaseList): HaircutAiUseCases {
  const [
    uploadPhoto,
    requestSuggestion,
    getStatus,
    selectVariant,
    giveConsent,
    revokeConsent,
    deletePhoto,
    listMyAi,
    referencePhotoUrl,
    adminReferencePhotoUrl,
  ] = list;
  return {
    uploadPhoto,
    requestSuggestion,
    getStatus,
    selectVariant,
    giveConsent,
    revokeConsent,
    deletePhoto,
    listMyAi,
    referencePhotoUrl,
    adminReferencePhotoUrl,
  };
}
