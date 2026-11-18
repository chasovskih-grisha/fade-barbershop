import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommissionTierOverrideSection from './CommissionTierOverrideSection';

describe('CommissionTierOverrideSection', () => {
  it('renders current tier and updates commission tier and multiplier', async () => {
    const mockSave = jest.fn().mockResolvedValue(true);

    render(
      <CommissionTierOverrideSection
        barberId="barber-1"
        currentTier="silver"
        bonusMultiplier={1.1}
        onSaveTier={mockSave}
      />
    );

    expect(screen.getByLabelText('Рівень комісії')).toHaveValue('silver');
    expect(screen.getByLabelText('Бонусний множник')).toHaveValue(1.1);

    fireEvent.change(screen.getByLabelText('Рівень комісії'), {
      target: { value: 'gold' },
    });
    fireEvent.change(screen.getByLabelText('Бонусний множник'), {
      target: { value: '1.25' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Зберегти рівень комісії' }));
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('gold', 1.25);
      expect(screen.getByText('Рівень комісії та бонуси успішно оновлено')).toBeInTheDocument();
    });
  });
});
