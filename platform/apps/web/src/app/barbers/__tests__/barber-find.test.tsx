import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarbersClient } from '../BarbersClient';
import type { StudioRoster } from '@/lib/api/studio-directory';

jest.mock(
  '@fade/ui',
  () => {
    const React = jest.requireActual('react');
    const Card = ({ children }: { children: ReactNode }) =>
      React.createElement('div', null, children);
    const TextField = ({
      label,
      value,
      onChange,
      placeholder,
    }: {
      label: string;
      value: string;
      placeholder?: string;
      onChange: (event: { target: { value: string } }) => void;
    }) => {
      const id = `field-${label}`;
      return React.createElement(
        'div',
        null,
        React.createElement('label', { htmlFor: id }, label),
        React.createElement('input', { id, type: 'search', value, placeholder, onChange })
      );
    };
    return { cn: () => '', Card, TextField };
  },
  { virtual: true }
);

const kyiv: StudioRoster = {
  code: 'KYI-01',
  name: 'Fade Kyiv',
  city: 'Київ',
  barbers: [
    { id: 'b1', userId: 'u1', slug: 'oleksandr', name: 'Олександр', role: '', active: true, photoUrl: null },
  ],
};

const lviv: StudioRoster = {
  code: 'LVI-01',
  name: 'Fade Lviv',
  city: 'Львів',
  barbers: [
    { id: 'b2', userId: 'u2', slug: 'ivan', name: 'Іван', role: '', active: true, photoUrl: null },
  ],
};

const field = () => screen.getByLabelText('Знайти майстра');

describe('BarbersClient — знайти майстра', () => {
  it('keeps the heading of a studio that still has a matching card and hides the emptied one', async () => {
    render(<BarbersClient studios={[kyiv, lviv]} />);

    await userEvent.type(field(), 'Іван');

    expect(screen.getByRole('link', { name: 'Іван' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Олександр' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fade Lviv/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Fade Kyiv/ })).not.toBeInTheDocument();
  });

  it('says nothing matched and clears back to the whole roster', async () => {
    render(<BarbersClient studios={[kyiv, lviv]} />);

    await userEvent.type(field(), 'zzz');
    expect(screen.getByText('Майстрів за вашим запитом не знайдено')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Скинути фільтри' }));

    expect(screen.getByRole('link', { name: 'Олександр' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Іван' })).toBeInTheDocument();
    expect(field()).toHaveValue('');
  });

  it('places the field before the cards in tab order', () => {
    render(<BarbersClient studios={[kyiv, lviv]} />);

    const firstCard = screen.getByRole('link', { name: 'Олександр' });
    const follows = field().compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING;

    expect(follows).toBeTruthy();
  });
});
