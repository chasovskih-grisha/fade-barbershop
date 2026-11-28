import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarberDetailPage, { generateMetadata } from '../[slug]/page';
import * as staffApi from '@/lib/api/staff';

jest.mock('@/lib/api/staff', () => ({ getBarberBySlug: jest.fn() }));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('notFound');
  }),
}));

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

const inactive = {
  id: 'barber-2',
  userId: 'barber-2',
  slug: 'ihor',
  name: 'Ігор Петренко',
  role: 'Майстер-барбер',
  active: false,
  photoUrl: null,
};

describe('BarberDetailPage: вимкнений майстер (T-4865a)', () => {
  beforeEach(() => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValue({ state: 'ok', data: inactive });
  });

  it('пояснює стан і не веде на /booking', async () => {
    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: 'ihor' }) });
    render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Ігор Петренко' })).toBeInTheDocument();
    const bookLinks = screen
      .queryAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/booking'));
    expect(bookLinks).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Обрати іншого майстра' })).toHaveAttribute(
      'href',
      '/barbers'
    );
  });

  it('лишає сторінку поза індексом', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'ihor' }) });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
