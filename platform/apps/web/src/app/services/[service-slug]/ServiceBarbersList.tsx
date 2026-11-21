import type { Barbers } from './service-overview.types';

const H = ({ text }: { text: string }) => <p className="text-sm text-fg-muted">{text}</p>;

export function ServiceBarbersList({ result }: { result: Barbers }) {
  if (result.state === 'error') return <H text={result.message} />;
  if (result.state === 'ok' && result.data.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {result.data.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-lg bg-interactive p-4 border border-line hover:border-accent transition-colors"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 font-display text-xl text-accent font-bold">
              {b.name[0]}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-fg line-clamp-1">{b.name}</h4>
              <p className="text-xs text-accent font-medium">Експерт-барбер ★ 4.9</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <>
      {result.state === 'empty' && <H text="Немає доступних майстрів" />}
      <H text="Немає активних майстрів" />
    </>
  );
}
