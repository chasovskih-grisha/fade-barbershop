import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Sheet } from './Sheet';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open Sheet
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sheet Title">
        <p>Sheet Content Body</p>
      </Sheet>
    </div>
  );
}

describe('Sheet Component', () => {
  it('renders bottom sheet when open', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Sheet Title' })).toBeInTheDocument();
    expect(screen.getByText('Sheet Content Body')).toBeInTheDocument();
  });

  it('closes sheet on close button click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Sheet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
