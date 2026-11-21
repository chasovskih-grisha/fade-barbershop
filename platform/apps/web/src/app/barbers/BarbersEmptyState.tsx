interface BarbersEmptyStateProps {
  onReset: () => void;
}

export function BarbersEmptyState({ onReset }: BarbersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 rounded-[var(--radius-card)] bg-surface-sunken/50 border border-line text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl">
        🔍
      </div>
      <h3 className="text-h3 font-display font-bold text-fg">
        Майстрів за вашим запитом не знайдено
      </h3>
      <p className="text-body text-fg-secondary max-w-md">
        Спробуйте змінити критерії пошуку або обрати іншу категорію фільтрації, щоб знайти
        потрібного спеціаліста.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 rounded-pill bg-accent px-6 py-2.5 text-caption font-semibold text-accent-fg transition-colors hover:bg-fg-secondary cursor-pointer"
      >
        Скинути фільтри
      </button>
    </div>
  );
}
