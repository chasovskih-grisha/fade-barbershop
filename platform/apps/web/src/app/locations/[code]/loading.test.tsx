import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from './loading';

// @fade/ui не резолвиться у web-jest (baseline) — підміняємо віртуально,
// як у LocationInactive.test.tsx.
jest.mock(
  '@fade/ui',
  () => {
    const React = jest.requireActual('react');
    return {
      Skeleton: ({ className }: { className?: string }) =>
        React.createElement('div', { 'data-testid': 'skeleton', className }),
    };
  },
  { virtual: true }
);

// T-4838: скелет студії тримає ширину плану візиту — без «стрибка» ширини
// після завантаження, і без фейкової карти чи ціни.
describe('locations/[code] loading (T-4838)', () => {
  it('тримає ту саму ширину, що готовий план візиту', () => {
    const { container } = render(<Loading />);
    const shell = container.firstElementChild as HTMLElement;

    expect(shell.className).toContain('max-w-container');
    expect(shell.className).not.toContain('max-w-3xl');
  });

  it('показує герой і два блоки, а не сітку з двох карток', () => {
    const { container } = render(<Loading />);
    const shell = container.firstElementChild as HTMLElement;

    expect(shell.querySelector('[data-section="hero"]')).not.toBeNull();
    expect(shell.querySelectorAll('section')).toHaveLength(3);
    expect(container.querySelector('.grid')).toBeNull();
  });
});
