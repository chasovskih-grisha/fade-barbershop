// Реекспорт типів портів для адаптера (щоб Prisma-файл не тягнув увесь
// ports-модуль і лишався читабельним).
export type {
  AnonymizationResult,
  ErasureRecord,
  ErasureStore,
  ErasureSubject,
} from '../application/erasure.ports';
