import { fireEvent, render, screen } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';

describe('AlertBanner', () => {
  it('помилка оголошується агресивно (role=alert)', () => {
    render(<AlertBanner title="Не вдалося завантажити локації." />);
    expect(screen.getByRole('alert').textContent).toContain('Не вдалося завантажити локації.');
  });

  it('успіх та інфо — role=status (полагідно)', () => {
    const { rerender } = render(<AlertBanner tone="success" title="Статтю опубліковано" />);
    expect(screen.getByRole('status').textContent).toContain('Статтю опубліковано');
    rerender(<AlertBanner tone="info" title="Чернетка збережена" />);
    expect(screen.getByRole('status').textContent).toContain('Чернетка збережена');
  });

  it('показує опис і викликає дію (патерн Retry)', () => {
    const onClick = jest.fn();
    render(
      <AlertBanner
        title="Помилка мережі"
        description="Сервіс каталогу недоступний."
        action={{ label: 'Спробувати ще раз', onClick }}
      />
    );
    expect(screen.getByText('Сервіс каталогу недоступний.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('під час повторного запиту дію блоковано (немає подвійного запиту)', () => {
    const onClick = jest.fn();
    render(
      <AlertBanner
        title="Помилка"
        action={{ label: 'Спробувати ще раз', onClick, loading: true }}
      />
    );
    const button = screen.getByRole('button', { name: 'Спробувати ще раз' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('закриття прибирає банер (кнопка з доступною назвою)', () => {
    const onDismiss = jest.fn();
    render(<AlertBanner tone="info" title="Підказка" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Закрити повідомлення' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('без дії та закриття — лише текст, без зайвих кнопок', () => {
    render(<AlertBanner title="Нотатка" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
