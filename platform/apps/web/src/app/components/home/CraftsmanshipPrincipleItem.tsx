import type { CraftsmanshipPrinciple } from './craftsmanship-data';

export function CraftsmanshipPrincipleItem({ principle }: { principle: CraftsmanshipPrinciple }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] bg-surface-sunken/60 border border-line hover:border-accent-blue/40 transition-colors">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm">
        {principle.number}
      </span>
      <div>
        <h3 className="font-display font-semibold text-fg">{principle.title}</h3>
        <p className="text-caption text-fg-secondary mt-0.5">{principle.description}</p>
      </div>
    </div>
  );
}
