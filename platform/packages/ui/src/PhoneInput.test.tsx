import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { PhoneInput } from './PhoneInput';

const renderPhone = (props: Partial<ComponentProps<typeof PhoneInput>> = {}) =>
  render(<PhoneInput label="Телефон" value="" onValueChange={jest.fn()} {...props} />);

describe('PhoneInput', () => {
  it('показує label і масковане значення', () => {
    renderPhone({ value: '+380671234567' });
    const input = screen.getByLabelText('Телефон') as HTMLInputElement;
    expect(input.value).toBe('+38 (067) 123-45-67');
  });

  it('віддає E.164 при введенні', () => {
    const onValueChange = jest.fn();
    renderPhone({ onValueChange });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '0671234567' } });
    expect(onValueChange).toHaveBeenCalledWith('+380671234567');
  });

  it('позначає помилку і показує текст під полем', () => {
    renderPhone({ error: 'Невірний номер' });
    const input = screen.getByLabelText('Телефон');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe('Невірний номер');
  });

  it('показує help, коли немає помилки', () => {
    renderPhone({ help: 'У форматі +38' });
    expect(screen.getByText('У форматі +38')).toBeTruthy();
  });
});
