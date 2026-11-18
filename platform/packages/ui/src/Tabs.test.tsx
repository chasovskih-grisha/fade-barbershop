import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs, type TabItem } from './Tabs';

const items: TabItem[] = [
  { id: 'a', label: 'Перша', content: <p>Панель А</p> },
  { id: 'b', label: 'Друга', content: <p>Панель Б</p> },
  { id: 'c', label: 'Третя', content: <p>Панель В</p>, disabled: true },
];

describe('Tabs', () => {
  it('показує активну панель і позначає вкладку', () => {
    render(<Tabs items={items} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('tabpanel').textContent).toBe('Панель А');
    expect(screen.getByRole('tab', { name: 'Перша' }).getAttribute('aria-selected')).toBe('true');
  });

  it('перемикає вкладку на клік', () => {
    const onChange = jest.fn();
    render(<Tabs items={items} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Друга' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('перемикає стрілками, пропускаючи disabled', () => {
    const onChange = jest.fn();
    const { rerender } = render(<Tabs items={items} value="b" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Друга' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('a');
    onChange.mockClear();
    rerender(<Tabs items={items} value="a" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Перша' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('Home і End переходять на межі', () => {
    const onChange = jest.fn();
    const { rerender } = render(<Tabs items={items} value="b" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Друга' }), { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('a');
    onChange.mockClear();
    rerender(<Tabs items={items} value="a" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Перша' }), { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ігнорує сторонні клавіші', () => {
    const onChange = jest.fn();
    render(<Tabs items={items} value="a" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Перша' }), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('рендерить порожній tablist без елементів', () => {
    render(<Tabs items={[]} value="" onChange={jest.fn()} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });
});
