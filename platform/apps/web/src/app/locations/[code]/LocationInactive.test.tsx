import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationInactive } from './LocationInactive';

// @fade/ui не резолвиться у web-jest (baseline), тому підміняємо віртуально,
// як у blog/__tests__/article-metadata.test.tsx.
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

// T-4839a: вимкнена локація не пропонує локальний запис — лише вихід на список.

describe('LocationInactive (T-4839a)', () => {
  it('не показує посилання на /booking', () => {
    render(<LocationInactive name="FADE Поділ" />);

    const bookLinks = screen
      .queryAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/booking');

    expect(bookLinks).toHaveLength(0);
    expect(screen.queryByText('Записатися онлайн')).not.toBeInTheDocument();
  });

  it('лишає вихід на /locations', () => {
    render(<LocationInactive name="FADE Поділ" />);

    const listLink = screen.getByRole('link', { name: 'Обрати іншу локацію' });
    expect(listLink).toHaveAttribute('href', '/locations');
  });

  it('називає локацію у заголовку', () => {
    render(<LocationInactive name="FADE Поділ" />);

    expect(screen.getByRole('heading', { level: 1, name: 'FADE Поділ' })).toBeInTheDocument();
  });
});
