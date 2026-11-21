import type { StyleItem } from './style-configurator-data';

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-semantic-warning shrink-0 mt-0.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export function StyleDetailsCard({ style }: { style: StyleItem }) {
  return (
    <div className="bg-surface/80 border border-semantic-warning/30 rounded-card p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-semantic-warning/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-semantic-warning bg-semantic-warning/10 px-3 py-1 rounded-md">
            Деталі обраного сервісу
          </div>
          <h3 className="text-h2 sm:text-h3 font-bold text-fg">{style.name}</h3>
          <p className="text-fg-secondary text-body leading-relaxed">{style.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {style.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 bg-surface-sunken/50 p-3 rounded-card border border-line"
              >
                <CheckIcon />
                <span className="text-sm text-fg font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center bg-surface-sunken/60 p-6 sm:p-8 rounded-card border border-line/80 space-y-6">
          <div className="text-center lg:text-right">
            <span className="text-xs text-fg-secondary uppercase tracking-wider block mb-1">
              Вартість процедури
            </span>
            <span className="text-h1 font-extrabold text-semantic-warning">{style.price}</span>
            <span className="text-xs text-fg-secondary block mt-1">
              Тривалість: {style.duration} • Без прихованих плат
            </span>
          </div>

          <a
            href="/booking"
            className="w-full bg-semantic-warning hover:bg-semantic-warning text-accent-fg font-bold py-4 px-6 rounded-card transition-all shadow-lg flex items-center justify-center gap-2 text-body"
          >
            Записатися на стрижку
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
