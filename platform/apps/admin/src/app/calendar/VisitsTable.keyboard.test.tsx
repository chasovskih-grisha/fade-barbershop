import { fireEvent } from '@testing-library/react';
import { rows, renderTable } from './visits-table.fixture';

describe('клавіатура в сітці візитів (T-4524)', () => {
  it('стрілка вниз/вгору рухає вибір на сусідній рядок', () => {
    const onSelect = jest.fn();
    const { container } = renderTable({ onSelect });
    const [first, second] = rows(container);
    fireEvent.keyDown(first!, { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenLastCalledWith('apt-2');
    fireEvent.keyDown(second!, { key: 'ArrowUp' });
    expect(onSelect).toHaveBeenLastCalledWith('apt-1');
  });

  it('стрілка на краю списку не вибирає нічого', () => {
    const onSelect = jest.fn();
    const { container } = renderTable({ onSelect });
    fireEvent.keyDown(rows(container)[0]!, { key: 'ArrowUp' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Enter і Space відкривають картку вибраного рядка', () => {
    const onSelect = jest.fn();
    const { container } = renderTable({ onSelect });
    const [first] = rows(container);
    fireEvent.keyDown(first!, { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith('apt-1');
    fireEvent.keyDown(first!, { key: ' ' });
    expect(onSelect).toHaveBeenLastCalledWith('apt-1');
  });
});
