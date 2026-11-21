import Link from 'next/link';
import { DISTRICT_BENCHMARKS, type DistrictBenchmark } from './reputation-data';

function BenchmarkCard({ benchmark }: { benchmark: DistrictBenchmark }) {
  return (
    <div className="p-8 rounded-card border border-line bg-surface shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-accent transition-all">
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-accent-blue/10 blur-2xl group-hover:bg-accent-blue/20 transition-all pointer-events-none" />
      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">
            {benchmark.badge}
          </span>
          <span className="text-caption font-semibold text-fg-secondary">
            Відгуків: {benchmark.reviewsCount}
          </span>
        </div>
        <h3 className="font-display text-h4 font-bold text-fg">{benchmark.district}</h3>
        <div className="flex items-center gap-6 pt-2">
          <div className="flex flex-col">
            <span className="text-caption text-fg-secondary">Рейтинг FADE</span>
            <span className="font-display text-2xl font-bold text-fg">
              {benchmark.fadeRating} ★
            </span>
          </div>
          <div className="h-10 w-[1px] bg-line" />
          <div className="flex flex-col">
            <span className="text-caption text-fg-secondary">Середнє по району</span>
            <span className="font-display text-2xl font-bold text-fg-muted">
              {benchmark.marketAverage} ★
            </span>
          </div>
          <div className="h-10 w-[1px] bg-line" />
          <div className="flex flex-col">
            <span className="text-caption text-fg-secondary">Тональність</span>
            <span className="font-display text-2xl font-bold text-accent-blue">
              {benchmark.sentimentScore}
            </span>
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-line flex items-center justify-between relative z-10">
        <span className="text-caption text-fg-secondary">
          Перевищує ринковий стандарт на <strong className="text-fg">+0.36★</strong>
        </span>
        <Link href="/booking" className="text-body font-semibold text-accent-blue hover:underline">
          Записатися тут &rarr;
        </Link>
      </div>
    </div>
  );
}

export function ReputationBenchmarks() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DISTRICT_BENCHMARKS.map((benchmark) => (
          <BenchmarkCard key={benchmark.district} benchmark={benchmark} />
        ))}
      </div>
    </div>
  );
}
