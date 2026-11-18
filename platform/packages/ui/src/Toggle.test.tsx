import { fireEvent, render, screen } from '@testing-library/react';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('звʼязує label з перемикачем', () => {
    render(<Toggle label="Сповіщення" />);
    expect(screen.getByLabelText('Сповіщення')).toBeTruthy();
  });

  it('викликає onChange при кліку', () => {
    const onChange = jest.fn();
    render(<Toggle label="Сповіщення" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Сповіщення'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('показує опис під label', () => {
    render(<Toggle label="Push" description="Отримувати сповіщення на телефон" />);
    expect(screen.getByText('Отримувати сповіщення на телефон')).toBeTruthy();
  });

  it('позначає помилку', () => {
    render(<Toggle label="Сповіщення" error="Обов'язкове поле" />);
    expect(screen.getByRole('alert').textContent).toBe("Обов'язкове поле");
    expect(screen.getByLabelText('Сповіщення').getAttribute('aria-invalid')).toBe('true');
  });

  it('вимикається через disabled', () => {
    render(<Toggle label="Сповіщення" disabled />);
    expect((screen.getByLabelText('Сповіщення') as HTMLInputElement).disabled).toBe(true);
  });
});
