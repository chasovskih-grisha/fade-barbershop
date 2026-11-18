import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceStep from '../steps/ServiceStep';
import BarberStep from '../steps/BarberStep';
import SlotStep from '../steps/SlotStep';

describe('Quick Booking Loading States (T-053as)', () => {
  it('ServiceStep renders skeleton when loading is true', () => {
    render(<ServiceStep services={[]} loading={true} onBack={() => {}} onSelect={() => {}} />);
    const container = document.querySelector('[aria-busy="true"]');
    expect(container).toBeInTheDocument();
  });

  it('BarberStep renders skeleton when loading is true', () => {
    render(<BarberStep barbers={[]} loading={true} onBack={() => {}} onSelect={() => {}} />);
    const container = document.querySelector('[aria-busy="true"]');
    expect(container).toBeInTheDocument();
  });

  it('SlotStep renders skeleton when loading is true', () => {
    render(
      <SlotStep
        slots={[]}
        days={[{ date: '2026-11-09', label: 'Сьогодні', isMondayFirst: 0 }]}
        date="2026-11-09"
        loading={true}
        selectedSlot={null}
        onDate={() => {}}
        onSelect={() => {}}
        onBack={() => {}}
        onNext={() => {}}
      />
    );
    const container = document.querySelector('[aria-busy="true"]');
    expect(container).toBeInTheDocument();
  });
});
