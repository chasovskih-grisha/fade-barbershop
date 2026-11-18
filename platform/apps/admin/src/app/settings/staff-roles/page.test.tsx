import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaffRolesManager } from './StaffRolesManager';

describe('StaffRolesManager', () => {
  it('renders staff roles management interface with default staff', () => {
    render(<StaffRolesManager />);
    expect(screen.getByText('Керування ролями та правами доступу (RBAC)')).toBeInTheDocument();
    expect(screen.getByText('Олександр Березюк')).toBeInTheDocument();
    expect(screen.getByText('Максим Коваль')).toBeInTheDocument();
  });

  it('filters staff by search query', () => {
    render(<StaffRolesManager />);
    const searchInput = screen.getByPlaceholderText("Введіть ім'я чи email...");
    fireEvent.change(searchInput, { target: { value: 'Максим' } });

    expect(screen.getByText('Максим Коваль')).toBeInTheDocument();
    expect(screen.queryByText('Андрій Мельник')).not.toBeInTheDocument();
  });

  it('updates staff permission checkbox', () => {
    render(<StaffRolesManager />);
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox corresponds to first staff member's canManageStaff
    const firstCheckbox = checkboxes[0];
    expect(firstCheckbox).toBeDefined();
    if (!firstCheckbox) return;
    expect(firstCheckbox).toBeChecked();

    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();
  });
});
