import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// T-4855: /barbers and /barbers/{slug} are held to the night system.
// docs/design-system.md forbids gradients in UI and limits accent.blue to the
// AI flow and focus-visible. This guard fails if the poster classes return.
const FILES = [
  join(__dirname, '..', 'page.tsx'),
  join(__dirname, '..', 'BarbersClient.tsx'),
  join(__dirname, '..', 'BarberCard.tsx'),
  join(__dirname, '..', 'BarbersMasterclassVIPShowcase.tsx'),
  join(__dirname, '..', '[slug]', 'BarberDetailContent.tsx'),
];

const FORBIDDEN = [
  'fade-card-gradient',
  'bg-gradient',
  'bg-accent-blue',
  'text-accent-blue',
  'border-accent-blue',
  'blur-2xl',
  'blur-3xl',
  'animate-pulse',
  'tracking-wider',
  'border-border',
  'text-[2.75rem]',
];

describe('Barber pages night system (T-4855)', () => {
  it.each(FILES)('%s carries no poster decoration', (file) => {
    const source = readFileSync(file, 'utf8');
    for (const token of FORBIDDEN) {
      expect(source).not.toContain(token);
    }
  });
});
