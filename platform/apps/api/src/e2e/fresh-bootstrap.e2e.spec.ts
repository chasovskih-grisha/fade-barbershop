// fresh-bootstrap: гейт замовчування сіду і порядку сіду.
// Структура (механіка docker/psql — у fresh-bootstrap.docker.ts):
//  1) docker compose -f infra/docker-compose.yml down -v
//  2) up -d  (postgres, redis, minio + застосунки)
//  3) очікуємо pg_isready (healthcheck postgres)
//  4) запуск pnpm --filter @fade/api run seed:e2e
//     (seed:dev + seed:customers + seed:appointments + seed:admin)
//  5) перевірка: кожен активний seed-клієнт має ClientProfile
//     (барбери/адміни CRM-профілю не мають — сід їх не створює);
//     як мінімум 5 демо-клієнтів.
//  6) docker compose down -v
//
// Механіка розділена: fresh-bootstrap.docker.ts (compose + psql),
// fresh-bootstrap.stack.ts (підйом, pg_isready, запуск сіду).
import { dockerExec, psql } from './fresh-bootstrap.docker';
import { resetStack, runSeedE2e, waitForPgReady } from './fresh-bootstrap.stack';

/** Активні seed-користувачі + факт наявності CRM-профілю, як TS-рядок. */
type SeedUser = { role: string; id: string; phone: string; has_profile: boolean };

// Таблиці/колонки Prisma без @@map: PascalCase-моделі, camelCase-поля
// ("User", "ClientProfile.userId"). Профіль сід лише для клієнтів
// (seed-customers): барбери (seed-dev) і адміни (seed-admin) CRM-профілю
// не мають — включати їх у перевірку означало б хибні падіння.
const PROFILE_QUERY = `
  WITH active AS (
    SELECT id, phone, role
    FROM "User"
    WHERE active = true AND role IN ('client','web','mobile')
  )
  SELECT a.role, a.id, a.phone, p.id IS NOT NULL AS has_profile
  FROM active a
  LEFT JOIN "ClientProfile" p ON p."userId" = a.id
  ORDER BY a.role, a.id;
`;

/** psql віддає таблицю: заголовок, лінія-роздільник (---+---), дані і
 * підсумок «(N rows)» — усе це сміття, лишаються лише рядки даних. */
function parseRows(out: string): SeedUser[] {
  return out
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || /^[-+]+$/.test(line) || /^\(\d+ rows?\)$/.test(line)) return false;
      // Заголовок таблиці — єдиний рядок, де є назва колонки has_profile.
      return !line.split('|').some((cell) => cell.trim() === 'has_profile');
    })
    .map((line) => {
      const [role, id, phone, hasProfile] = line.split('|').map((c) => c.trim());
      if (!role || !id || !phone || hasProfile === undefined)
        throw new Error(`unparsed psql row: ${line}`);
      return { role, id, phone, has_profile: hasProfile === 't' };
    });
}

describe('fresh-bootstrap (order of the seed)', () => {
  beforeAll(async () => {
    resetStack();
    await waitForPgReady();
  });

  afterAll(async () => {
    try {
      dockerExec(['down', '-v']);
    } catch {
      // ignore cleanup failures
    }
  });

  it('fresh bootstrap: every web/mobile/client seed user has a client profile', async () => {
    runSeedE2e();
    const rows = parseRows(psql(PROFILE_QUERY));

    const missing = rows.filter((u) => !u.has_profile);
    if (missing.length) {
      throw new Error(`[fresh-bootstrap] seed users without profile: ${JSON.stringify(missing)}`);
    }
    if (rows.length < 5) {
      throw new Error(
        `[fresh-bootstrap] expected at least 5 active seed users (clients), got ${rows.length}`
      );
    }
  });
});
