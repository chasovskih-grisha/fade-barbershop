'use client';

import React from 'react';
import Link from 'next/link';

export function HomeMasterclassMasteryPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-accent-blue/40 bg-gradient-to-br from-surface-raised via-surface to-surface-sunken p-8 md:p-12 shadow-2xl">
      <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -top-24 w-96 h-96 bg-semantic-warning/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm">
            ✦ Exclusive Masterclass
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-fg leading-tight">
            The Fade Platinum Hair & Beard Mastery
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Go behind the chair with our Master Artisans. Learn professional grooming techniques,
            precision fading principles, and bespoke beard architecture in our intimate quarterly
            masterclass session.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 rounded-pill bg-surface border border-line px-4 py-2 text-body text-fg-secondary">
              <span className="text-accent-blue font-bold">✓</span> 1-on-1 Master Guidance
            </div>
            <div className="flex items-center gap-2 rounded-pill bg-surface border border-line px-4 py-2 text-body text-fg-secondary">
              <span className="text-accent-blue font-bold">✓</span> Professional Kit Included
            </div>
            <div className="flex items-center gap-2 rounded-pill bg-surface border border-line px-4 py-2 text-body text-fg-secondary">
              <span className="text-accent-blue font-bold">✓</span> Certificate of Mastery
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 shrink-0 bg-surface-sunken/80 border border-line p-6 rounded-card backdrop-blur-md shadow-lg w-full md:w-auto">
          <div className="text-center md:text-right">
            <span className="text-caption uppercase tracking-wider text-fg-secondary">
              Limited to 10 Seats / Quarter
            </span>
            <div className="font-display text-2xl font-bold text-fg mt-0.5">
              Secure Your Masterclass
            </div>
          </div>
          <Link
            href="/booking"
            className="inline-flex h-12 w-full md:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md hover:scale-[1.02]"
          >
            Apply for Masterclass &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
