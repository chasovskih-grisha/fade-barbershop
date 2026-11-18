// Провайдери use cases контексту haircut-ai (окремо від cycle/worker —
// identity/identity.module.ts, та сама конвенція).
//
// Порти (PhotoStorage, Clock, репозиторії) — інтерфейси: emitDecoratorMetadata
// стирає їх до Object, тому Nest не інжектить їх у конструктори напряму.
// Адаптери передаються фабрикою з concrete-класів, структурно задовольняющих порт.

import type { Provider } from '@nestjs/common';
import { UploadPhoto, RequestSuggestionHandler, GetSuggestionStatusHandler, SelectVariantHandler, GiveConsentHandler, RevokeConsentHandler, DeletePhotoHandler, ListMyAiHandler, GetReferencePhotoUrl, GetAdminReferencePhotoUrl } from '../application/haircut-ai-use-case.tokens';
import { S3PhotoStorage } from './s3-photo-storage';
import { PrismaSourcePhotoRepository } from './prisma-source-photo.repository';
import { PrismaHaircutSuggestionRepository } from './prisma-haircut-suggestion.repository';
import { PrismaHaircutAiOutbox } from './haircut-ai-outbox';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { HaircutAiHandlers, toUseCases, type HaircutAiUseCaseList } from './haircut-ai-handlers';
import { useCase } from './haircut-ai-use-case.factory';

const UOW = PrismaUnitOfWork;
const PHOTOS = PrismaSourcePhotoRepository;
const SUGGESTIONS = PrismaHaircutSuggestionRepository;
const OUTBOX = PrismaHaircutAiOutbox;
const STORAGE = S3PhotoStorage;

export const haircutAiUseCaseProviders: Provider[] = [
  STORAGE,
  PHOTOS,
  SUGGESTIONS,
  OUTBOX,
  SystemClock,
  UuidIdGenerator,
  UOW,

  // prettier-ignore
  useCase(UploadPhoto, [STORAGE, PHOTOS, OUTBOX, SystemClock, UuidIdGenerator, UOW],
    ([storage, photos, outbox, clock, ids, uow]) => ({ storage, photos, outbox, clock, ids, uow })),
  useCase(
    RequestSuggestionHandler,
    [PHOTOS, SUGGESTIONS, SystemClock, UuidIdGenerator, UOW],
    ([photos, suggestions, clock, ids, uow]) => ({ photos, suggestions, clock, ids, uow })
  ),
  useCase(GetSuggestionStatusHandler, [SUGGESTIONS, STORAGE], ([suggestions, storage]) => ({
    suggestions,
    storage,
  })),
  useCase(
    SelectVariantHandler,
    [SUGGESTIONS, STORAGE, OUTBOX, SystemClock, UOW],
    ([suggestions, storage, outbox, clock, uow]) => ({ suggestions, storage, outbox, clock, uow })
  ),
  useCase(
    GiveConsentHandler,
    [PHOTOS, OUTBOX, SystemClock, UOW],
    ([photos, outbox, clock, uow]) => ({ photos, outbox, clock, uow })
  ),
  useCase(
    RevokeConsentHandler,
    [PHOTOS, OUTBOX, SystemClock, UOW],
    ([photos, outbox, clock, uow]) => ({ photos, outbox, clock, uow })
  ),
  // prettier-ignore
  useCase(DeletePhotoHandler, [PHOTOS, SUGGESTIONS, STORAGE, OUTBOX, SystemClock, UOW],
    ([photos, suggestions, storage, outbox, clock, uow]) => ({ photos, suggestions, storage, outbox, clock, uow })),
  useCase(
    ListMyAiHandler,
    [PHOTOS, SUGGESTIONS, STORAGE, SystemClock],
    ([photos, suggestions, storage, clock]) => ({ photos, suggestions, storage, clock })
  ),

  // Підписаний URL референсного фото (REF-WEB-03, ADR 0008 §2).
  useCase(GetReferencePhotoUrl, [PHOTOS, STORAGE], ([photos, storage]) => ({ photos, storage })),
  // Підписаний URL для адмін/барбер-поверхні картки візиту (REF-BARBER).
  // prettier-ignore
  useCase(GetAdminReferencePhotoUrl, [PHOTOS, STORAGE], ([photos, storage]) => ({ photos, storage })),

  {
    provide: HaircutAiHandlers,
    useFactory: (...useCases: HaircutAiUseCaseList) =>
      new HaircutAiHandlers(toUseCases(...useCases)),
    inject: [
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
    ],
  },
];
