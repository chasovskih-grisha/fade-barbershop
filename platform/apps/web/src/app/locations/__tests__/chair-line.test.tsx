import { render, screen } from '@testing-library/react';
import { LocationChairLine } from '../LocationChairLine';
import type { Chair } from '@/lib/api/locations';

// T-4830a: одна лінія про крісла. Лічильник рахує активні крісла; іменоване
// крісло показує ім'я, понад два імені стискаються до «+N»; нуль активних —
// лінії немає. Жодного «приватний формат».

const chair = (number: number, name: string | null, active = true): Chair => ({
  number,
  name,
  active,
});

describe('LocationChairLine (T-4830a)', () => {
  it('counts active chairs when the chairs have no names', () => {
    render(<LocationChairLine chairs={[chair(1, null), chair(2, null), chair(3, null, false)]} />);
    expect(screen.getByText('2 крісла')).toBeTruthy();
  });

  it('shows the name of a named chair', () => {
    render(<LocationChairLine chairs={[chair(1, 'Біля вікна'), chair(2, null)]} />);
    expect(screen.getByText('Крісла: Біля вікна')).toBeTruthy();
  });

  it('truncates more than two names but keeps the count visible', () => {
    render(
      <LocationChairLine chairs={[chair(1, 'Біля вікна'), chair(2, 'Кут'), chair(3, 'Дзеркало')]} />
    );
    expect(screen.getByText('Крісла: Біля вікна, Кут +1')).toBeTruthy();
  });

  it('renders nothing for zero active chairs and claims no private format', () => {
    const { container } = render(
      <LocationChairLine chairs={[chair(1, null, false), chair(2, 'Кут', false)]} />
    );
    expect(container.textContent).toBe('');
    expect(container.textContent).not.toContain('приватний формат');
  });
});
