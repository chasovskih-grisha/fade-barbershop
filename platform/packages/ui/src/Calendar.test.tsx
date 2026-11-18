import { fireEvent, render, screen } from '@testing-library/react';
import { CalendarDay, CalendarWeek } from './Calendar';

const visits = [{ id: 'v1', time: '10:00', status: 'confirmed' as const }];

describe('CalendarDay', () => {
  it('рендерить візити зі статусами і позначку сьогодні', () => {
    render(<CalendarDay label="Пн" dateLabel="21" isToday visits={visits} />);
    expect(screen.getByText('Пн')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
    expect(screen.getByText('Підтверджено')).toBeTruthy();
  });

  it('для не-сьогоднішнього дня використовує приглушений підпис', () => {
    render(<CalendarDay label="Вт" dateLabel="22" />);
    expect(screen.getByText('22').className).toContain('text-fg-muted');
  });

  it('як кнопка реагує на клік', () => {
    const onSelect = jest.fn();
    render(<CalendarDay label="Пн" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Пн' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('CalendarWeek', () => {
  it('рендерить сім днів', () => {
    const days = Array.from({ length: 7 }, (_, index) => ({ label: `Д${index + 1}` }));
    render(<CalendarWeek days={days} />);
    expect(screen.getAllByText(/^Д\d$/)).toHaveLength(7);
  });
});
