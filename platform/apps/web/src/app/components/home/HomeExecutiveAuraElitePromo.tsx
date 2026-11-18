'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function HomeExecutiveAuraElitePromo() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 42, seconds: 19 });
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-semantic-warning/50 bg-gradient-to-r from-surface-raised via-surface to-surface-sunken p-8 md:p-12 shadow-2xl">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-semantic-warning/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/15 border border-semantic-warning/30 px-4 py-1.5 text-caption font-bold uppercase text-semantic-warning tracking-wider w-fit shadow-sm">
            ✦ Executive Aura & Elite Concierge Pass
          </div>
          <h2 className="font-display text-3xl md:text-display font-extrabold text-fg leading-tight">
            The Ultimate Gentleman Experience & Priority Privilege
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Secure private lounge access, master stylist allocation, complimentary bourbon & hot towel ritual, and zero-wait priority booking for your next executive appointment.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-pill bg-surface/80 border border-line px-3.5 py-2 text-body text-fg">
              <span className="text-semantic-warning font-bold">✦</span> Private Lounge
            </div>
            <div className="flex items-center gap-2 rounded-pill bg-surface/80 border border-line px-3.5 py-2 text-body text-fg">
              <span className="text-semantic-warning font-bold">✦</span> Master Barber
            </div>
            <div className="flex items-center gap-2 rounded-pill bg-surface/80 border border-line px-3.5 py-2 text-body text-fg col-span-2 sm:col-span-1">
              <span className="text-semantic-warning font-bold">✦</span> Bourbon & Spa
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-end gap-5 shrink-0 bg-surface-sunken/90 border border-semantic-warning/30 p-6 md:p-8 rounded-card backdrop-blur-md shadow-xl w-full lg:w-auto text-center lg:text-right">
          <div className="flex flex-col gap-1 items-center lg:items-end">
            <span className="text-caption uppercase tracking-wider text-semantic-warning font-bold">
              Limited Elite Allocation
            </span>
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-fg bg-surface px-3 py-1 rounded-input border border-line shadow-inner">
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
              <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/booking"
              onClick={() => setClaimed(true)}
              className="inline-flex h-12 w-full lg:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-bold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.02]"
            >
              {claimed ? 'Access Granted ✓' : 'Claim Elite Pass →'}
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 w-full lg:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
            >
              View Packages
            </Link>
          </div>
          <span className="text-caption text-fg-muted">
            Includes complimentary valet & priority re-booking guarantee.
          </span>
        </div>
      </div>
    </section>
  );
}
