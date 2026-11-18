import { fireEvent, render, screen } from '@testing-library/react';
import { RatingStars } from './RatingStars';

describe('RatingStars', () => {
  it('у read-only режимі показує оцінку як зображення', () => {
    render(<RatingStars value={3} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Оцінка: 3 з 5');
  });

  it('в інтерактивному режимі викликає onChange', () => {
    const onChange = jest.fn();
    render(<RatingStars value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '5 з 5' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('позначає вибрану зірку', () => {
    render(<RatingStars value={4} onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: '4 з 5' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '5 з 5' }).getAttribute('aria-checked')).toBe('false');
  });
});
