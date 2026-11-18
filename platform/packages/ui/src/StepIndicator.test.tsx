import { render, screen } from '@testing-library/react';
import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  it('позначає поточний крок через aria-current та role=status', () => {
    render(<StepIndicator steps={['Послуга', 'Час', 'Оплата']} current={1} />);
    const activeSpan = screen.getByText('Час').parentElement;
    expect(activeSpan?.getAttribute('aria-current')).toBe('step');
    expect(activeSpan?.getAttribute('role')).toBe('status');
  });

  it('розрізняє виконані, поточний і майбутні кроки за новими токенами стилів', () => {
    render(<StepIndicator steps={['A', 'B', 'C']} current={1} />);
    expect(screen.getByText('A').parentElement?.className).toContain('bg-zinc-400');
    expect(screen.getByText('B').parentElement?.className).toContain('bg-amber-500');
    expect(screen.getByText('C').parentElement?.className).toContain('bg-zinc-200');
  });
});
