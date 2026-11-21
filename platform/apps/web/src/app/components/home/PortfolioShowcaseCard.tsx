import Link from 'next/link';
import type { PortfolioShowcaseItem } from './portfolio-showcase-data';

export function PortfolioShowcaseCard({
  item,
  index,
}: {
  item: PortfolioShowcaseItem;
  index: number;
}) {
  return (
    <div className="group relative flex flex-col justify-between rounded-card border border-line bg-surface-raised overflow-hidden shadow-md transition-all duration-300 hover:border-accent-blue/50 hover:shadow-xl hover:-translate-y-1">
      <div
        className={`h-52 w-full bg-gradient-to-br ${item.imageGradient} flex items-center justify-center p-6 relative overflow-hidden border-b border-line`}
      >
        <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-50" />
        <div className="absolute top-3 right-3 rounded-pill bg-surface/95 border border-line px-3 py-1 text-caption font-semibold text-fg shadow-sm">
          {item.tag}
        </div>
        <div className="text-center z-10 flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-full bg-surface/80 border border-line flex items-center justify-center text-accent font-display font-bold text-h4 shadow-sm group-hover:scale-110 transition-transform">
            {index + 1}
          </span>
          <span className="text-body font-display font-bold text-fg drop-shadow-sm">
            {item.category}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col justify-between flex-1 gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-h4 font-display font-bold text-fg group-hover:text-accent-blue transition-colors">
            {item.title}
          </h3>
          <p className="text-caption text-fg-secondary">{item.description}</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-line/80 text-body-s text-fg-secondary">
          <span>
            Майстер: <strong className="text-fg">{item.barber}</strong>
          </span>
          <Link href="/booking" className="text-accent font-semibold hover:underline">
            Записатися &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
