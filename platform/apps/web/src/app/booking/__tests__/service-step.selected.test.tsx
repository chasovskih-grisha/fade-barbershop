import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceStep from '../steps/ServiceStep';
import { type ServiceDto } from '../types';

const SERVICES: ServiceDto[] = [
  { id: 'svc-1', name: 'Чоловіча стрижка', duration: 50, price: 600 },
  { id: 'svc-2', name: 'Гоління', duration: 30, price: 400 },
];

const NOOP = { onBack: () => {}, onSelect: () => {} };

describe('ServiceStep selected card (T-4742b)', () => {
  it('обрана картка бере кістяну плитку слота, а не ring', () => {
    render(<ServiceStep services={SERVICES} {...NOOP} />);

    const card = screen.getByText('Чоловіча стрижка').closest('[role="button"]');
    const other = screen.getByText('Гоління').closest('[role="button"]');
    if (!card || !other) throw new Error('Картки послуг не знайдено');

    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(other.className).not.toContain('bg-accent');

    fireEvent.click(card);

    const selectedCard = screen.getByText('Чоловіча стрижка').closest('[role="button"]');
    if (!selectedCard) throw new Error('Обрану картку послуги не знайдено');
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
    expect(selectedCard.className).toContain('bg-accent');
    expect(selectedCard.className).toContain('text-accent-fg');
    expect(selectedCard.className).toContain('font-medium');
    expect(selectedCard.className).not.toContain('ring-fg');
    expect(selectedCard.className).not.toContain('bg-surface-raised');
    expect(other.className).not.toContain('bg-accent');
  });
});
