// Картка візиту показує зафіксовану тривалість (`end − start`), а не поточну
// з каталогу: після зміни тривалості послуги чинний візит не рухається (T-4618b).
import { render, screen } from '@testing-library/react';
import { BookingSummaryCard } from './BookingSummaryCard';
import { detailFixture } from './booking-test-helpers';

describe('BookingSummaryCard — зафіксована тривалість', () => {
  it('показує тривалість візиту, навіть коли каталог уже інший', () => {
    render(
      <BookingSummaryCard
        detail={detailFixture({
          durationMinutes: 30,
          service: { id: 'svc-1', name: 'Стрижка', duration: 45, category: 'core' },
        })}
      />
    );
    expect(screen.getByText('30 хв')).toBeInTheDocument();
    expect(screen.queryByText('45 хв')).not.toBeInTheDocument();
  });
});
