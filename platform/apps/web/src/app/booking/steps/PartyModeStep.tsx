'use client';

// Екран 1б флоу запису (T-4521c, booking-flow.md §Екран 1б): режим «батько + син».
// З'являється лише для пакетної послуги; без вибору «Далі» неактивне (PARTY-002).

import { useState } from 'react';
import { Button } from '@fade/ui';
import type { ModeCard, PartyMode } from '../party-flow';

function ModeOption({
  card,
  selected,
  onPick,
}: {
  card: ModeCard;
  selected: boolean;
  onPick: (id: PartyMode) => void;
}) {
  const tone = selected ? 'border-accent bg-surface-raised' : 'border-line bg-surface-sunken';
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={card.disabled}
      data-testid={`party-mode-${card.id}`}
      onClick={() => onPick(card.id)}
      className={`flex flex-col items-start gap-1 rounded-card border p-4 text-left transition-all ${tone} ${
        card.disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      <span className="font-semibold text-fg">{card.title}</span>
      <span className="text-body-s text-fg-secondary">{card.subtitle}</span>
      <span className="text-body-s text-fg">{card.text}</span>
      {card.warning ? (
        <span role="note" className="text-body-s text-fg">
          ⚑ {card.warning}
        </span>
      ) : null}
      {card.reason ? <span className="text-body-s text-fg-secondary">{card.reason}</span> : null}
    </button>
  );
}

export default function PartyModeStep({
  cards,
  onBack,
  onNext,
}: {
  cards: ModeCard[];
  onBack: () => void;
  onNext: (mode: PartyMode) => void;
}) {
  const [selected, setSelected] = useState<PartyMode | null>(null);
  const chosen = cards.find((card) => card.id === selected);
  const blocked = chosen?.disabled ?? false;

  return (
    <div className="flex flex-col gap-4" data-testid="party-mode-step">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись до послуг
      </Button>
      <h2 className="font-display text-h4">Режим виконання</h2>
      <p className="text-body-s text-fg-secondary">
        Ціна пакета локації однакова в обох режимах.
      </p>
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <ModeOption
            key={card.id}
            card={card}
            selected={selected === card.id}
            onPick={setSelected}
          />
        ))}
      </div>
      <Button disabled={selected === null || blocked} onClick={() => selected && onNext(selected)}>
        Далі
      </Button>
    </div>
  );
}
