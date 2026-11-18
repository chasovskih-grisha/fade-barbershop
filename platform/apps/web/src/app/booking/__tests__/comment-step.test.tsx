// Специфікація екрана підтвердження (T-053au/T-053as): поле коментаря має
// справжній підпис (не placeholder) і зв'язаний лічильник, а сабміт показує
// loading-стан кнопки, а не лише disabled.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/react';
import CommentStep from '../steps/CommentStep';

function renderStep(overrides: Partial<Parameters<typeof CommentStep>[0]> = {}) {
  const props = {
    comment: '',
    setComment: jest.fn(),
    onBack: jest.fn(),
    onConfirm: jest.fn(),
    submitting: false,
    ...overrides,
  };
  render(<CommentStep {...props} />);
  return props;
}

describe('CommentStep', () => {
  it('поле коментаря має підпис і зв’язаний лічильник', () => {
    renderStep();
    const field = screen.getByLabelText('Коментар до зачіски (необов’язково)');
    expect(field).toHaveAttribute('maxLength', '500');
    expect(field).toHaveAttribute('aria-describedby', 'booking-comment-counter');
    expect(screen.getByText('0/500')).toHaveAttribute('id', 'booking-comment-counter');
  });

  it('введення оновлює лічильник через setComment', () => {
    const props = renderStep();
    fireEvent.change(screen.getByLabelText('Коментар до зачіски (необов’язково)'), {
      target: { value: 'коротше з боків' },
    });
    expect(props.setComment).toHaveBeenCalledWith('коротше з боків');
  });

  it('під час сабміту кнопка показує loading (aria-busy) і блокується', () => {
    const props = renderStep({ submitting: true });
    const button = screen.getByRole('button', { name: 'Підтвердити запис' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('показує обраний візит і каталожну ціну перед підтвердженням', () => {
    renderStep({
      locationName: 'Сіті Лейк',
      serviceName: 'Стрижка',
      durationMinutes: 45,
      price: 600,
      barberName: 'Олексій',
      time: '14:30–15:15',
    });

    expect(screen.getByText('Сіті Лейк')).toBeInTheDocument();
    expect(screen.getByText('Стрижка · 45 хв')).toBeInTheDocument();
    expect(screen.getByText('600 ₴')).toBeInTheDocument();
    expect(screen.getByText('Олексій')).toBeInTheDocument();
    expect(screen.getByText('14:30–15:15')).toBeInTheDocument();
    expect(screen.getByText('Оплата на місці')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Підтвердити запис' })).toBeInTheDocument();
  });

  it('не додає промокод і кнопку оплати', () => {
    renderStep({ price: 600 });

    expect(screen.queryByPlaceholderText(/промокод/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Сплатити|Оплатити/i })).toBeNull();
  });

  it('у стані спокою кнопка активна і викликає onConfirm', () => {
    const props = renderStep();
    const button = screen.getByRole('button', { name: 'Підтвердити запис' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
});
