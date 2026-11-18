// Фільтри журналу входів (owner-подання, T-4411 read-side): перемикач
// «Мій журнал / Усі адміністратори» + select адміна. Окремий файл за
// гейти max-lines/complexity (ADR 0019).
const select = 'rounded-input border border-line p-2';

export type AuditView = 'mine' | 'all';

/** Рядок списку адмінів для фільтра. */
export interface AdminOption {
  id: string;
  label: string;
}

export default function LoginsFilters({
  view,
  admins,
  userId,
  onViewChange,
  onUserChange,
}: {
  view: AuditView;
  admins: AdminOption[];
  userId: string;
  onViewChange: (view: AuditView) => void;
  onUserChange: (userId: string) => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      aria-label="Подання журналу"
      onSubmit={(e) => e.preventDefault()}
    >
      <label>
        Подання
        <select
          value={view}
          onChange={(e) => onViewChange(e.target.value as AuditView)}
          className={select}
        >
          <option value="mine">Мій журнал</option>
          <option value="all">Усі адміністратори</option>
        </select>
      </label>
      {view === 'all' && admins.length > 0 && (
        <label>
          Адмін
          <select value={userId} onChange={(e) => onUserChange(e.target.value)} className={select}>
            <option value="">Усі</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </form>
  );
}
