'use client';

// Крок 2 у режимі parallel (T-4521c, PARTY-WEB-03): «Будь-які два вільні» або
// рівно два різні барбери. Барбер поза матрицею послуги — disabled із
// посиланням на матрицю: пара з ним має нульовий перетин (PARTY-004).

import Link from 'next/link';
import { Button } from '@fade/ui';
import { MATRIX_HREF } from '../party-flow';
import type { PairCandidate, PairProblem } from '../party-flow';

const PROBLEM_TEXT: Record<PairProblem, string> = {
  'choose-two': 'Оберіть рівно двох різних барберів.',
  'same-barber': 'Той самий барбер на обидві ноги не підходить — оберіть другого.',
  'not-in-matrix': 'Один із барберів не виконує цю послугу — оберіть іншого.',
};

function CandidateOption({
  candidate,
  selected,
  onToggle,
}: {
  candidate: PairCandidate;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const tone = selected ? 'border-accent bg-surface-raised' : 'border-line bg-surface-sunken';
  return (
    <div className={`rounded-card border p-4 ${tone} ${candidate.eligible ? '' : 'opacity-60'}`}>
      <button
        type="button"
        aria-pressed={selected}
        disabled={!candidate.eligible}
        data-testid={`party-pair-${candidate.id}`}
        onClick={() => onToggle(candidate.id)}
        className="flex w-full flex-col items-start gap-1 text-left disabled:cursor-not-allowed"
      >
        <span className="font-semibold text-fg">{candidate.name}</span>
      </button>
      {candidate.reason ? (
        <p className="mt-1 text-body-s text-fg-secondary">
          {candidate.reason}{' '}
          <Link href={MATRIX_HREF} className="underline">
            матриця барберів
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export default function BarberPairStep({
  candidates,
  selected,
  problem,
  onToggle,
  onAny,
  onBack,
  onNext,
}: {
  candidates: PairCandidate[];
  selected: string[];
  problem: PairProblem | null;
  onToggle: (id: string) => void;
  onAny: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4" data-testid="party-pair-step">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись до режиму
      </Button>
      <h2 className="font-display text-h4">Два барбери</h2>
      <button
        type="button"
        aria-pressed={selected.length === 0}
        data-testid="party-pair-any"
        onClick={onAny}
        className={`flex flex-col items-start gap-1 rounded-card border p-4 text-left ${
          selected.length === 0 ? 'border-accent bg-surface-raised' : 'border-line bg-surface-sunken'
        }`}
      >
        <span className="font-semibold text-fg">Будь-які два вільні</span>
        <span className="text-body-s text-fg-secondary">Перші два вільні крісла на обраний час</span>
      </button>
      {candidates.map((candidate) => (
        <CandidateOption
          key={candidate.id}
          candidate={candidate}
          selected={selected.includes(candidate.id)}
          onToggle={onToggle}
        />
      ))}
      {problem && selected.length > 0 ? (
        <p role="alert" className="text-body-s text-fg">
          {PROBLEM_TEXT[problem]}
        </p>
      ) : null}
      <Button disabled={problem !== null} onClick={onNext}>
        Далі
      </Button>
    </div>
  );
}
