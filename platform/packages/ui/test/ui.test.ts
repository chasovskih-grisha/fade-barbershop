import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerBookingFlow } from '../src/booking';

describe('CustomerBookingFlow Component', () => {
  it('should render step 1 and allow selecting a service', () => {
    render(<CustomerBookingFlow />);
    
    expect(screen.getByText(/Step 1 of 4: Select Service/i)).toBeInTheDocument();
    
    const serviceOption = screen.getByLabelText(/Signature Fade & Beard Trim/i);
    expect(serviceOption).toBeInTheDocument();
    
    fireEvent.click(serviceOption);
    expect(serviceOption).toHaveAttribute('aria-checked', 'true');
  });

  it('should progress through steps upon selection and continue', () => {
    const handleComplete = jest.fn();
    render(<CustomerBookingFlow onCompleteBooking={handleComplete} />);

    // Step 1: Select Service
    const serviceOption = screen.getByLabelText(/Signature Fade & Beard Trim/i);
    fireEvent.click(serviceOption);

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    // Step 2: Select Barber
    expect(screen.getByText(/Step 2 of 4: Choose Your Barber/i)).toBeInTheDocument();
    const barberOption = screen.getByLabelText(/Marcus Vance/i);
    fireEvent.click(barberOption);
    fireEvent.click(continueBtn);

    // Step 3: Date, Time & Extras
    expect(screen.getByText(/Step 3 of 4: Date, Time & Extras/i)).toBeInTheDocument();
    fireEvent.click(continueBtn);

    // Step 4: Review & Confirm
    expect(screen.getByText(/Step 4 of 4: Review & Confirm/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Confirm Appointment/i });
    fireEvent.click(confirmBtn);

    expect(screen.getByText(/Appointment Confirmed!/i)).toBeInTheDocument();
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });
});
