import { act, fireEvent, render, screen } from '@testing-library/react';
import { Toast, ToastViewport } from './Toast';

describe('Toast', () => {
  it('показує заголовок і опис', () => {
    render(<Toast title="Збережено" description="Зміни застосовано" />);
    expect(screen.getByRole('status').textContent).toContain('Збережено');
    expect(screen.getByText('Зміни застосовано')).toBeTruthy();
  });

  it('для danger використовує role=alert', () => {
    render(<Toast title="Помилка" tone="danger" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('закривається кнопкою', () => {
    const onClose = jest.fn();
    render(<Toast title="Готово" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('автозакривається через duration', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<Toast title="Готово" onClose={onClose} duration={1000} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('рендерить дію', () => {
    render(<Toast title="Готово" action={<button type="button">Скасувати</button>} />);
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeTruthy();
  });

  it('ToastViewport рендерить дітей', () => {
    render(
      <ToastViewport data-testid="viewport">
        <Toast title="x" data-testid="toast-item" />
      </ToastViewport>
    );
    expect(screen.getByTestId('viewport')).toBeTruthy();
    expect(screen.getByTestId('toast-item')).toBeTruthy();
  });
});
