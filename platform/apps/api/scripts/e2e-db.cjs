// Ізольована БД для e2e-сюїт.
//
// Навіщо: сюїти з реальним PrismaService писали фікстури («LC Barber», booking-и,
// staff) у спільну dev-БД — вони зʼявлялися в адмінських dropdown'ах і псували
// сід, а ще вичерпували крісла/слоти. Окрема база дає жорстку межу: e2e фізично
// не бачить і не псує dev-дані.
//
// Чому база, а не схема на воркер: Prisma застосовує міграції до конкретної
// схеми, тож на схемі-на-воркер довелося б ганяти `migrate deploy` N разів
// (maxWorkers 35% на multicore → багато схем і `_prisma_migrations` у кожній).
// Одна база = один прогін міграцій, її легко переглянути й видалити.
//
// Використання:
//   node scripts/e2e-db.cjs prepare   — створити (idempotent) + застосувати міграції
//   node scripts/e2e-db.cjs url       — надрукувати URL (діагностика)
//   require('./e2e-db.cjs').e2eDatabaseUrl() — з jest.setup.js

const { execFileSync } = require('node:child_process');
const path = require('node:path');

/** Ім'я БД за замовчуванням; перекривається FADE_E2E_DB_NAME. */
const E2E_DB_NAME = process.env.FADE_E2E_DB_NAME || 'barbershop_e2e';

/** Той самий дефолт, що й у docs/seeding.md (без env — локальний docker-compose). */
const DEFAULT_BASE_URL =
  'postgresql://barbershop:barbershop@localhost:15432/barbershop?schema=public';

function baseUrl() {
  return process.env.DATABASE_URL || DEFAULT_BASE_URL;
}

/** Імʼя бази з URL — потрібен для запобіжника «не сідай у dev». */
function databaseNameOf(url) {
  return new URL(url).pathname.replace(/^\//, '');
}

/** Той самий URL, але з базою e2e; параметри (?schema=…) зберігаються. */
function e2eDatabaseUrl(from = baseUrl()) {
  const url = new URL(from);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

/**
 * Запобіжник: щоб помилка конфігурації не виглядала як «все працює, але
 * знову в dev-БД». Коли мішень та сама база, що й у базовому URL — це не ізоляція.
 */
function assertIsolated(target) {
  if (databaseNameOf(target) === databaseNameOf(baseUrl())) {
    throw new Error(
      `Ізоляція e2e не налаштована: мішень (${databaseNameOf(target)}) == база (${databaseNameOf(
        baseUrl()
      )}). Задай FADE_E2E_DB_NAME або окремий DATABASE_URL для тестів.`
    );
  }
  return target;
}

/** Створює базу (якщо немає) і застосовує міграції. Ідемпотентно. */
function prepare() {
  const target = assertIsolated(e2eDatabaseUrl());
  const env = { ...process.env, DATABASE_URL: target };
  console.log(`[e2e-db] готую ${databaseNameOf(target)} (${target.replace(/:[^:@/]*@/, ':***@')})`);
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '..'),
    env,
    stdio: 'inherit',
  });
  console.log('[e2e-db] готово');
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'prepare') prepare();
  else if (command === 'url') console.log(assertIsolated(e2eDatabaseUrl()));
  else {
    console.error('використання: node scripts/e2e-db.cjs prepare|url');
    process.exitCode = 1;
  }
}

module.exports = {
  E2E_DB_NAME,
  baseUrl,
  databaseNameOf,
  e2eDatabaseUrl,
  assertIsolated,
  prepare,
};
