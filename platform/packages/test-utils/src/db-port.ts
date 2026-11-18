// Єдине канонічне уявлення БД для e2e-фікстур (ADR 0019). Замінює raw
// `PrismaClient` із @prisma/client: пакет більше не володіє типом згенерованого
// клієнта (дуальний store — друге джерело правди про ту саму схему), а api
// передає сюди PrismaService або tx-клієнт без приведень. Відповідність порту
// реальному клієнту перевіряється там, де @prisma/client і є джерелом правди:
// apps/api/src/shared/prisma/test-db.conformance.ts (компіляційний контракт).
//
// Методи оголошені method-синтаксисом навмисне: TS застосовує до них
// bivariance, тож приймаються обидві форми Prisma-аргументів (Create*Args і
// *ManyArgs) — інакше довелося б приводити типи на кожному сіді.
//
// Позначені лише ті делегати й методи, які реально кличуть сіди й cleanup.
// Payload-поля довільні (`object`): фікстурні дані перевіряє e2e на живій БД,
// а не тип — порт свідомо не дублює схему (це і був корінь дуального store).

/** Делегат моделі Prisma: мінімальний зріз, потрібний фікстурам. */
export interface TestDbDelegate {
  /** Nested-create у сідах: агрегат цілком (локація з кріслами й годинами). */
  create(args: { data: object }): Promise<unknown>;
  /** Точкове видалення за унікальним ключем (location.delete). */
  delete(args: { where: object }): Promise<unknown>;
  /** Масове видалення за фільтром (FK-порядок cleanup). */
  deleteMany(args?: { where?: object }): Promise<{ count: number }>;
  /** Фікстури читають лише `select: { id: true }` — id гарантовано рядковий. */
  findMany(args: { where?: object; select?: object }): Promise<{ id: string }[]>;
}

/** Моделі, дотичні до e2e-фікстур: phone/user/location-піддерево/booking/outbox. */
export interface TestDb {
  user: TestDbDelegate;
  location: TestDbDelegate;
  chair: TestDbDelegate;
  openingHour: TestDbDelegate;
  booking: TestDbDelegate;
  service: TestDbDelegate;
  servicePrice: TestDbDelegate;
  staffAssignment: TestDbDelegate;
  availabilityWindow: TestDbDelegate;
  appointmentParty: TestDbDelegate;
  outboxMessage: TestDbDelegate;
}
