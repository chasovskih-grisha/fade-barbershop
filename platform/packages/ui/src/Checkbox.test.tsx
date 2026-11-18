import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('звʼязує label з чекбоксом', () => {
    render(<Checkbox label="Погоджуюсь" />);
    expect(screen.getByLabelText('Погоджуюсь')).toBeTruthy();
  });

  it('викликає onChange при кліку', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Погоджуюсь" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Погоджуюсь'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('показує опис під label', () => {
    render(<Checkbox label="Дозволяю AI" description="Фото обробляються один раз" />);
    expect(screen.getByText('Фото обробляються один раз')).toBeTruthy();
  });

  it('позначає помилку', () => {
    render(<Checkbox label="Погоджуюсь" error="Потрібна згода" />);
    expect(screen.getByRole('alert').textContent).toBe('Потрібна згода');
    expect(screen.getByLabelText('Погоджуюсь').getAttribute('aria-invalid')).toBe('true');
  });

  it('вимикається через disabled', () => {
    render(<Checkbox label="Погоджуюсь" disabled />);
    expect((screen.getByLabelText('Погоджуюсь') as HTMLInputElement).disabled).toBe(true);
  });

  it('підтримує прапорець indeterminate', () => {
    render(<Checkbox label="Вибрати все" indeterminate />);
    const checkbox = screen.getByLabelText('Вибрати все') as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });
});
