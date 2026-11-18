import { fireEvent, render, screen } from '@testing-library/react';
import { SlotPicker, type Slot } from './SlotPicker';

const slots: Slot[] = [
  { id: 's1', time: '10:00', state: 'free' },
  { id: 's2', time: '10:30', state: 'busy' },
  { id: 's3', time: '11:00', state: 'hold' },
  { id: 's4', time: '11:30', state: 'free', staff: 'Олег' },
];

describe('SlotPicker', () => {
  it('вимикає зайняті та hold-слоти', () => {
    render(<SlotPicker slots={slots} onChange={jest.fn()} />);
    expect((screen.getByRole('button', { name: '10:00' }) as HTMLButtonElement).disabled).toBe(
      false
    );
    expect((screen.getByRole('button', { name: '10:30' }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((screen.getByRole('button', { name: '11:00' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('викликає onChange для вільного слота', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={slots} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '10:00' }));
    expect(onChange).toHaveBeenCalledWith('s1');
  });

  it('позначає вибраний слот окремим стилем і додає барбера в aria-label', () => {
    render(<SlotPicker slots={slots} value="s1" onChange={jest.fn()} />);
    const selected = screen.getByRole('button', { name: '10:00' });
    const free = screen.getByRole('button', { name: '11:30, Олег' });
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(selected.className).toContain('bg-accent');
    expect(selected.className).toContain('text-accent-fg');
    expect(selected.className).not.toContain('bg-surface-sunken');
    expect(free.getAttribute('aria-pressed')).toBe('false');
    expect(free.className).toContain('bg-surface-sunken');
    expect(free.className).not.toContain('bg-accent');
  });

  it('перемикає «Будь-який барбер»', () => {
    const onToggle = jest.fn();
    const { rerender } = render(
      <SlotPicker slots={slots} onChange={jest.fn()} anyStaff={{ selected: false, onToggle }} />
    );
    const toggle = screen.getByRole('button', { name: 'Будь-який барбер' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(
      <SlotPicker slots={slots} onChange={jest.fn()} anyStaff={{ selected: true, onToggle }} />
    );
    expect(
      screen.getByRole('button', { name: 'Будь-який барбер' }).getAttribute('aria-pressed')
    ).toBe('true');
  });
});
