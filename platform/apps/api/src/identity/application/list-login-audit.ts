// ListLoginAudit (T-4411) — останні спроби входу адміна: окремий файл за
// гейтом max-lines. Read-side: тілько читання журналу (PrismaLoginAudit).
// Серія невдач (streak) — сигнал перебору паролів для власника адмінки:
// підряд невдалі спроби на голові кільця (найсвіжіші) одного користувача.

export interface AuditEntryView {
  ts: string;
  username: string;
  ok: boolean;
}

/** Серія невдач у голові списку (новіші-першими): скільки підряд !ok на старті.
 *  null — серії немає (остання спроба успішна або список порожній). */
export function failedStreakOf(
  entriesNewestFirst: Array<{ ok: boolean; userId?: string; username?: string }>
): number | null {
  const head = entriesNewestFirst[0];
  if (!head || head.ok) return null;
  // Групуємо за користувачем: у «всіх адмінах» черга інтерлінгована, серія —
  // це підряд невдач ОДНОГО userId, доки його ж успіх її не зупинить.
  const ownerKey = head.userId ?? head.username;
  let streak = 0;
  for (const entry of entriesNewestFirst) {
    const sameUser = (entry.userId ?? entry.username) === ownerKey;
    if (!sameUser) continue; // записи інших адмінів серію не переривають
    if (entry.ok) return streak > 0 ? streak : null;
    streak += 1;
  }
  return streak;
}

interface LoginAuditReader {
  list(
    userId: string,
    limit: number
  ): Promise<Array<{ ts: Date; username: string; ok: boolean; actorId: string | null }>>;
}

export class ListLoginAuditHandler {
  constructor(private readonly audit: LoginAuditReader) {}

  handle(input: {
    userId: string;
    limit?: number;
  }): Promise<{ entries: AuditEntryView[]; failedStreak: number | null }> {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
    return this.audit.list(input.userId, limit).then((rows) => {
      const entries = rows.map((r) => ({ ts: r.ts.toISOString(), username: r.username, ok: r.ok }));
      return { entries, failedStreak: failedStreakOf(entries) };
    });
  }
}

/** Спільний читач списку адмінів (для owner-подання; ListAdmins доступний в інших контекстах). */
interface AdminsReader {
  listAdmins(): Promise<string[]>;
}

/**
 * ListAllAdminLoginsHandler (T-4411 owner-подання, read-side): журнал входів
 * **усіх** адміністраторів — злиття per-admin кілець AppSetting (максимум 50
 * на адміна) + сортування новіші-першими, зріз `limit` після злиття. Фільтр
 * `userId` звужує до одного адміна. Права — той самий AdminSessionGuard;
 * гість 401, окремої owner-ролі в системі немає (v1). М'яка відмова від
 * недоступного кільця: адмін без AppSetting-ключа дає порожній список.
 */
export class ListAllAdminLoginsHandler {
  constructor(
    private readonly admins: AdminsReader,
    private readonly audit: LoginAuditReader
  ) {}

  async handle(input: { limit?: number; userId?: string }): Promise<{
    entries: Array<AuditEntryView & { userId: string }>;
    failedStreak: number | null;
  }> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const targets = input.userId ? [input.userId] : await this.admins.listAdmins();
    const merged = await Promise.all(
      targets.map(async (userId) => {
        try {
          const rows = await this.audit.list(userId, limit);
          return rows.map((r) => ({
            ts: r.ts.toISOString(),
            username: r.username,
            ok: r.ok,
            userId,
          }));
        } catch {
          return []; // м'яка відмова: кільце недоступне — не ламає все подання
        }
      })
    );
    const entries = merged
      .flat()
      .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0))
      .slice(0, limit);
    return { entries, failedStreak: failedStreakOf(entries) };
  }
}
