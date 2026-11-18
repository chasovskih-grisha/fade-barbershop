import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// T-4824: the listing is held to the night system. docs/design-system.md forbids
// gradients in UI and limits accent.blue to the AI flow and focus-visible; depth
// is a surface step and a 1px line. This guard fails if the poster classes return.
const source = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8');

const FORBIDDEN = [
  'fade-card-gradient',
  'bg-accent-blue',
  'text-accent-blue',
  'border-accent-blue',
  'blur-2xl',
  'blur-3xl',
  'animate-pulse',
  'tracking-wider',
  'px-4.5',
  'text-[2.75rem]',
  'CLT-01',
];

describe('Locations listing night system (T-4824)', () => {
  it.each(FORBIDDEN)('does not paint the route with %s', (token) => {
    expect(source).not.toContain(token);
  });

  it('keeps type and space on design-system tokens', () => {
    expect(source).toContain('text-display');
    expect(source).toContain('bg-surface');
    expect(source).toContain('border-line');
  });
});
