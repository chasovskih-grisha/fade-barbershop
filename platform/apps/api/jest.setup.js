// Jest setup (усі воркери).
//
// 1) Для e2e (FADE_E2E_ISOLATED=1, ставить `pretest:functional`) перемикаємо
//    DATABASE_URL на окрему базу barbershop_e2e. Без цього сюїти з реальним
//    PrismaService писали фікстури у спільну dev-БД: «LC Barber» та інші рядки
//    зʼявлялися в адмінських dropdown'ах, а крісла й слоти вичерпувалися.
//    Розділення БД робить ізоляцію фізичною, а не «ми попились прибирати».
//
//    Guard (assertIsolated) — навмисно падаємо, а не мовчки беремо dev: тихий
//    фолбек знову дав би змішування даних без видимої причини.
//
// 2) Обмежуємо пул Prisma на воркера. Без цього дефолтний пул (≈2×CPU+1) ×
//    кількість воркерів вичерпує max_connections Postgres під паралельним бігом
//    сюїт → ECONNRESET / P2024 / спорадичні 500. Ідемпотентно: якщо
//    connection_limit уже заданий — не чіпаємо.
//
//    Порядок навмисний: спершу ізоляція, потім параметри пулу. Інакше ми
//    додавали б connection_limit двічі — і в URL лишалися б дублікати
//    pool_timeout, що робить розбір параметрів неоднозначним.

// 0) Секрет resume-току депозиту (T-4619). Контролер підписує токен у відповіді
//    на створення візиту, тож без змінної e2e падає ПІСЛЯ коміту Booking:
//    retry у postWithRetry добиває слот і перетворює успіх на 409. Тестове
//    значення детерміноване й локальне — справжній секрет лишається в .env.
process.env.DEPOSIT_RESUME_SECRET ??= 'test-resume-secret';

const { databaseNameOf, assertIsolated, e2eDatabaseUrl } = require('./scripts/e2e-db.cjs');

// DATABASE_URL може бути не в process.env (Prisma сама читає .env), тоді
// e2eDatabaseUrl() бере документований локальний дефолт — ізоляція все одно
// перевіряється assertIsolated.
if (process.env.FADE_E2E_ISOLATED === '1') {
  const target = assertIsolated(e2eDatabaseUrl(process.env.DATABASE_URL));
  process.env.DATABASE_URL = target;
  console.log(`[jest] e2e ізольовано → ${databaseNameOf(target)}`);
}

const url = process.env.DATABASE_URL;
// prettier-ignore
if (url && !/[?&]connection_limit=/.test(url)) {
  process.env.DATABASE_URL = `${url}${url.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=20`;
}
