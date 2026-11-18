import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: '1', label: 'Опція 1' },
  { value: '2', label: 'Опція 2' },
  { value: '3', label: 'Опція 3', disabled: true },
];

describe('Select', () => {
  it('рендерить лейбл та плейсхолдер', () => {
    render(<Select label="Вибір" options={options} placeholder="Оберіть..." />);
    expect(screen.getByText('Вибір')).toBeTruthy();
    expect(screen.getByText('Оберіть...')).toBeTruthy();
  });

  it('відкриває список та вибирає опцію при кліку', () => {
    const onChange = jest.fn();
    render(<Select label="Вибір" options={options} onChange={onChange} />);
    
    const trigger = screen.getByRole('button', { name: /вибір/i });
    fireEvent.click(trigger);
    
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.click(screen.getByText('Опція 2'));
    
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('підтримує клавіатурну навігацію', () => {
    const onChange = jest.fn();
    render(<Select label="Вибір" options={options} onChange={onChange} value="1" />);
    
    const trigger = screen.getByRole('button', { name: /вибір/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    expect(trigger.getAttribute('aria-activedescendant')).toBeTruthy();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('показує стан завантаження', () => {
    render(<Select label="Вибір" options={options} loading />);
    expect(screen.getByText('Завантаження...')).toBeTruthy();
    expect((screen.getByRole('button', { name: /вибір/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('відображає помилку та aria-invalid', () => {
    render(<Select label="Вибір" options={options} error="Помилка вибору" />);
    expect(screen.getByRole('alert').textContent).toBe('Помилка вибору');
    expect(screen.getByRole('button', { name: /вибір/i }).getAttribute('aria-invalid')).toBe('true');
  });

  it('вимикається через disabled', () => {
    render(<Select label="Вибір" options={options} disabled />);
    expect((screen.getByRole('button', { name: /вибір/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
