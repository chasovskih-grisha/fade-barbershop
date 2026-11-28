import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BarberInactive } from './BarberInactive';

// @fade/ui не резолвиться у web-jest (baseline), тому підміняємо віртуально,
// як у locations/[code]/LocationInactive.test.tsx.
jest.mock(
  '@fade/ui',
  () => {
    const React = jest.requireActual('react');
    return {
      cn: () => '',
      AlertBanner: ({ title, children }: { title: string; children?: React.ReactNode }) =>
        React.createElement('div', null, React.createElement('h2', null, title), children),
    };
  },
  { virtual: true }
);

// T-4865a: вимкнений майстер не пропонує запис — лише вихід на довідник.

describe('BarberInactive (T-4865a)', () => {
  it('не показує посилання на /booking', () => {
    render(<BarberInactive name="Ігор Петренко" />);

    const bookLinks = screen
      .queryAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/booking'));

    expect(bookLinks).toHaveLength(0);
    expect(screen.queryByText('Записатися до майстра')).not.toBeInTheDocument();
  });

  it('лишає вихід на /barbers', () => {
    render(<BarberInactive name="Ігор Петренко" />);

    expect(screen.getByRole('link', { name: 'Обрати іншого майстра' })).toHaveAttribute(
      'href',
      '/barbers'
    );
  });

  it('називає майстра у заголовку', () => {
    render(<BarberInactive name="Ігор Петренко" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Ігор Петренко' })).toBeInTheDocument();
  });
});
