import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SidebarNav from './SidebarNav';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('SidebarNav Role Filtering (T-2400b)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('filters navigation items for barber role (schedule and clients only)', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'barber' }),
    });

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Панель керування' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Клієнти' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Локації' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Аналітика' })).not.toBeInTheDocument();
    });
  });

  it('filters navigation items for manager role (locations, clients, analytics)', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'manager' }),
    });

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Локації' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Клієнти' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Аналітика' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Логіни' })).not.toBeInTheDocument();
    });
  });

  it('shows all items for super-admin / owner role', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'owner' }),
    });

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Локації' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Клієнти' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Аналітика' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Логіни' })).toBeInTheDocument();
    });
  });
});
