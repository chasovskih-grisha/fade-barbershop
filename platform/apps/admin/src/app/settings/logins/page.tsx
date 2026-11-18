'use client';

// Журнал входів (T-4411 UI): «Мій журнал» + owner-подання «Усі адміністратори»
// (GET /admin/admins/logins?userId=, банер серії невдач — StreakBanner).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type LoginRow } from './LoginsTable';
import LoginsFilters, { type AdminOption, type AuditView } from './LoginsFilters';
import StreakBanner from './StreakBanner';
import { AuditBody, adminOptionsOf, getJson, auditUrl } from './AuditBody';

export default function LoginAuditPage() {
  const router = useRouter();
  const [view, setView] = useState<AuditView>('mine');
  const [entries, setEntries] = useState<LoginRow[] | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [userId, setUserId] = useState('');
  const [streak, setStreak] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const started = useRef(false);

  const load = useCallback(
    async (mode: AuditView, filterUserId?: string) => {
      try {
        const me = await getJson('/admin/auth/me');
        if (me.redirected) return router.push('/login');
        const { id } = (me.body as { id: string }) ?? {};
        const audit = await getJson(auditUrl(mode, id, filterUserId));
        if (audit.redirected) return router.push('/login');
        const body = (audit.body ?? {}) as { entries?: LoginRow[]; failedStreak?: number | null };
        const rows = Array.isArray(body.entries) ? body.entries : [];
        setEntries(rows);
        setStreak(typeof body.failedStreak === 'number' ? body.failedStreak : null);
        if (mode === 'all') setAdmins(adminOptionsOf(rows));
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    },
    [router]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load(view);
  }, [load, view]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="font-display text-h3">Налаштування · Журнал входів</h1>
        <p className="mt-1 text-body text-fg-secondary">
          Останні спроби входу в адмінку — новіші зверху. Невдалі — червоним.
        </p>
      </header>
      <LoginsFilters
        view={view}
        admins={admins}
        userId={userId}
        onViewChange={(next) => {
          setView(next);
          setUserId('');
          setEntries(null);
          void load(next);
        }}
        onUserChange={(next) => {
          setUserId(next);
          void load('all', next || undefined);
        }}
      />
      <StreakBanner streak={streak} />
      <AuditBody
        loadError={loadError}
        entries={entries}
        onRetry={() => void load(view, userId || undefined)}
      />
    </div>
  );
}
