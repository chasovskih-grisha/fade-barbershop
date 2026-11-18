// Тіло журналу входів і хелпери запитів (T-4411 UI) — окремо від сторінки за LOC.
import { Button } from '@fade/ui';
import LoginsTable, { type LoginRow } from './LoginsTable';
import type { AdminOption, AuditView } from './LoginsFilters';

export function AuditBody({
  loadError,
  entries,
  onRetry,
}: {
  loadError: boolean;
  entries: LoginRow[] | null;
  onRetry: () => void;
}) {
  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-card border border-line bg-surface-raised p-4">
        <p className="text-body text-fg-secondary">Не вдалося завантажити журнал входів.</p>
        <Button variant="secondary" size="md" onClick={onRetry}>
          Спробувати ще раз
        </Button>
      </div>
    );
  }
  if (entries === null) return null;
  if (entries.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface-raised p-4 text-body text-fg-secondary">
        Записів ще немає.
      </p>
    );
  }
  return <LoginsTable entries={entries} showAdmin={entries.some((e) => e.userId !== undefined)} />;
}

export function adminOptionsOf(entries: LoginRow[] | null): AdminOption[] {
  const seen = new Map<string, string>();
  for (const entry of entries ?? []) {
    if (typeof entry.userId === 'string' && !seen.has(entry.userId))
      seen.set(entry.userId, entry.userId.slice(0, 8));
  }
  return Array.from(seen, ([id, label]) => ({ id, label }));
}

export async function getJson(url: string): Promise<{ redirected: boolean; body?: unknown }> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (res.status === 401) return { redirected: true };
  if (!res.ok) throw new Error(`API ${res.status}`);
  return { redirected: false, body: await res.json() };
}

export function auditUrl(mode: AuditView, adminId: string, filterUserId?: string): string {
  if (mode === 'mine') return `/admin/admins/${adminId}/logins`;
  return `/admin/admins/logins${filterUserId ? `?userId=${encodeURIComponent(filterUserId)}` : ''}`;
}
