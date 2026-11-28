'use client';

import React, { useState } from 'react';
import { MASTERCLASSES } from './masterclass-data';
import { MasterclassDetailCard } from './MasterclassDetailCard';

export function BarbersMasterclassVIPShowcase() {
  const [selectedMasterclass, setSelectedMasterclass] = useState<number | null>(1);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const currentClass = MASTERCLASSES.find((m) => m.id === selectedMasterclass) ?? MASTERCLASSES[0]!;

  const handleBooking = () => {
    setBookedSuccess(true);
    setTimeout(() => setBookedSuccess(false), 4000);
  };

  return (
    <section className="mt-16 rounded-card bg-surface-sunken border border-line p-8 md:p-12">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-1.5 text-caption font-semibold uppercase text-fg-muted w-fit mx-auto md:mx-0">
            ✨ Ексклюзивні майстер-класи та VIP-програми від топ-барберів
          </div>
          <h2 className="font-display text-h2 font-bold text-fg leading-tight">
            Освоюйте майстерність або замовляйте VIP-трансформацію
          </h2>
          <p className="text-bodyLg text-fg-secondary max-w-3xl">
            Наші провідні майстри діляться професійними секретами на авторських майстер-класах або
            надають персональний VIP-консалтинг для найвибагливіших клієнтів.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MASTERCLASSES.map((cls) => (
            <button
              type="button"
              key={cls.id}
              onClick={() => {
                setSelectedMasterclass(cls.id);
                setBookedSuccess(false);
              }}
              className={`p-6 rounded-card text-left transition-all flex flex-col justify-between gap-4 border cursor-pointer ${
                selectedMasterclass === cls.id
                  ? 'bg-surface border-accent shadow-xl ring-2 ring-accent/30 scale-[1.02]'
                  : 'bg-surface/50 border-line hover:border-line-strong hover:bg-surface/80'
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="text-caption font-semibold text-semantic-warning uppercase">
                  {cls.level}
                </span>
                <h3 className="font-display text-h4 font-bold text-fg">{cls.title}</h3>
                <p className="text-caption text-fg-secondary">{cls.instructor}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <span className="text-caption text-fg-secondary">{cls.duration}</span>
                <span className="text-body font-bold text-fg">{cls.price}</span>
              </div>
            </button>
          ))}
        </div>

        <MasterclassDetailCard
          masterclass={currentClass}
          bookedSuccess={bookedSuccess}
          onBook={handleBooking}
        />

      </div>
    </section>
  );
}
