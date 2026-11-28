import { filterBarbers, type Barber } from '../barbers-filter';

const roster: Barber[] = [
  { id: 'b1', slug: 'oleksandr', name: 'Олександр' },
  { id: 'b2', slug: 'ivan', name: 'Іван' },
  { id: 'b3', slug: 'mykola', name: 'Микола', specialties: ['Борода'] },
];

const names = (query: string) => filterBarbers(roster, 'all', query).map((barber) => barber.name);

describe('filterBarbers — пошук майстра за ім’ям', () => {
  it('leaves the cards whose name contains the typed letters', () => {
    expect(names('лекс')).toEqual(['Олександр']);
  });

  it('ignores the case of the typed letters', () => {
    expect(names('ІВАН')).toEqual(['Іван']);
  });

  it('ignores spaces around the typed letters', () => {
    expect(names('  кола  ')).toEqual(['Микола']);
  });

  it('does not match a specialty that is not part of the name', () => {
    expect(names('бород')).toEqual([]);
  });

  it('restores the whole roster when the field is cleared', () => {
    expect(names('')).toHaveLength(roster.length);
  });
});
