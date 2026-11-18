import { render, screen, fireEvent } from '@testing-library/react';
import { RevenuePricingManager } from './RevenuePricingManager';

describe('RevenuePricingManager', () => {
  it('renders revenue pricing manager with active strategies and metrics', () => {
    render(<RevenuePricingManager />);
    expect(screen.getByText(/FADE — Управління доходом та оптимізація ціноутворення/i)).toBeInTheDocument();
    expect(screen.getByText(/Вечірній піковий коефіцієнт/i)).toBeInTheDocument();
    expect(screen.getByText(/Прогнозований приріст AOV/i)).toBeInTheDocument();
  });

  it('toggles rule status when clicking disable/enable', () => {
    render(<RevenuePricingManager />);
    const buttons = screen.getAllByRole('button', { name: /Вимкнути/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]!);
    expect(screen.getByRole('button', { name: /Увімкнути/i })).toBeInTheDocument();
  });

  it('allows adding a new pricing rule', () => {
    const onSave = jest.fn();
    render(<RevenuePricingManager onSaveRule={onSave} />);
    const nameInput = screen.getByPlaceholderText(/Назва правила/i);
    const descInput = screen.getByPlaceholderText(/Опис ефекту/i);
    const addButton = screen.getByRole('button', { name: /Додати/i });

    fireEvent.change(nameInput, { target: { value: 'VIP субота' } });
    fireEvent.change(descInput, { target: { value: 'Націнка у вихідні' } });
    fireEvent.click(addButton);

    expect(screen.getByText('VIP субота')).toBeInTheDocument();
    expect(onSave).toHaveBeenCalled();
  });
});
