import { fireEvent, render, screen } from '@testing-library/react';
import { OtpInput } from './OtpInput';

const cells = () => screen.getAllByRole('textbox');
const spy = () => jest.fn();

describe('OtpInput', () => {
  it('рендерить шість комірок із label', () => {
    render(<OtpInput value="" onChange={spy()} />);
    expect(cells()).toHaveLength(6);
    expect(screen.getByText('Код з SMS')).toBeTruthy();
  });

  it('вводить цифру й викликає onChange', () => {
    const onChange = spy();
    render(<OtpInput value="" onChange={onChange} />);
    fireEvent.change(cells()[0], { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('ігнорує нецифрові символи', () => {
    const onChange = spy();
    render(<OtpInput value="" onChange={onChange} />);
    fireEvent.change(cells()[0], { target: { value: 'x' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('викликає onComplete на шостій цифрі', () => {
    const onComplete = jest.fn();
    render(<OtpInput value="12345" onChange={spy()} onComplete={onComplete} />);
    fireEvent.change(cells()[5], { target: { value: '6' } });
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('backspace очищає заповнену комірку', () => {
    const onChange = spy();
    render(<OtpInput value="123" onChange={onChange} />);
    fireEvent.keyDown(cells()[2], { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('backspace у порожній комірці стирає попередню', () => {
    const onChange = spy();
    render(<OtpInput value="12" onChange={onChange} />);
    fireEvent.keyDown(cells()[2], { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('реагує на стрілки без помилок', () => {
    render(<OtpInput value="12" onChange={spy()} />);
    fireEvent.keyDown(cells()[1], { key: 'ArrowLeft' });
    fireEvent.keyDown(cells()[1], { key: 'ArrowRight' });
    fireEvent.keyDown(cells()[0], { key: 'Enter' });
    expect(cells()).toHaveLength(6);
  });

  it('вставляє код із буфера', () => {
    const onChange = spy();
    render(<OtpInput value="" onChange={onChange} />);
    fireEvent.paste(cells()[0], { clipboardData: { getData: () => '123 456' } });
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('ігнорує буфер без цифр', () => {
    const onChange = spy();
    render(<OtpInput value="" onChange={onChange} />);
    fireEvent.paste(cells()[0], { clipboardData: { getData: () => 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('показує помилку під полем', () => {
    render(<OtpInput value="" onChange={spy()} error="Введіть 6 цифр з SMS" />);
    expect(screen.getByRole('alert').textContent).toBe('Введіть 6 цифр з SMS');
  });

  it('вимикає всі комірки в стані disabled', () => {
    render(<OtpInput value="" onChange={spy()} disabled />);
    for (const cell of cells()) {
      expect((cell as HTMLInputElement).disabled).toBe(true);
    }
  });

  it('фокусує першу комірку за autoFocus', () => {
    render(<OtpInput value="" onChange={spy()} autoFocus />);
    expect(document.activeElement).toBe(cells()[0]);
  });
});
