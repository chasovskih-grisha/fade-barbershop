import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChairUtilizationHeatmap } from './ChairUtilizationHeatmap';

describe('ChairUtilizationHeatmap', () => {
  it('renders chair heat map and hourly slots correctly', () => {
    render(<ChairUtilizationHeatmap />);

    expect(screen.getByText(/Теплова карта завантаження стільця #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Fade/i)).toBeInTheDocument();
    expect(screen.getByText(/78%/i)).toBeInTheDocument(); // Overall utilization

    // Check hourly cells
    expect(screen.getByText('9:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('triggers gap compression when button is clicked', async () => {
    const handleOptimize = jest.fn().mockResolvedValue(undefined);
    render(<ChairUtilizationHeatmap onOptimize={handleOptimize} />);

    const button = screen.getByRole('button', { name: /Ущільнити проміжні вікна/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleOptimize).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/успішно ущільнено/i)).toBeInTheDocument();
    });
  });
});
