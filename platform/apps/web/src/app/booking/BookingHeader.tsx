// Шапка флоу запису (T-041): презентаційна — винесена з page.tsx, щоб сторінка
// не перетинала LOC-гейт (ADR 0019) після додавання анонсів і фокуса кроків.

export default function BookingHeader() {
  return (
    <div className="rounded-card border border-accent-blue/30 bg-surface-sunken p-4 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-semibold shrink-0">
          ✦
        </div>
        <div>
          <div className="text-body font-semibold text-fg">Консьєрж-запис Fade</div>
          <div className="text-caption text-fg-secondary">
            Миттєве підтвердження • Без передплат • Напій у подарунок
          </div>
        </div>
      </div>
      <div className="hidden sm:inline-flex items-center gap-1.5 rounded-pill bg-accent/10 text-accent px-3 py-1 text-caption font-semibold">
        60 секунд
      </div>
    </div>
  );
}
