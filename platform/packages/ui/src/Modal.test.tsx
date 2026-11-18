import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Dialog } from './Dialog';

type DialogLike = ComponentType<{
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}>;

function Toggle({ Component, label }: { Component: DialogLike; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      <Component open={open} onClose={() => setOpen(false)} title={label}>
        Вміст
      </Component>
    </>
  );
}

describe('Modal / Sheet', () => {
  it('Modal рендерить центральний діалог із вмістом', () => {
    render(<Toggle Component={Dialog} label="Модалка" />);
    fireEvent.click(screen.getByRole('button', { name: 'Модалка' }));
    expect(screen.getByRole('dialog', { name: 'Модалка' })).toBeTruthy();
    expect(screen.getByText('Вміст')).toBeTruthy();
    expect(screen.getByTestId('dialog-panel').className).toContain('rounded-card');
  });

  it('у закритому стані нічого не рендерить', () => {
    render(
      <Dialog open={false} onClose={jest.fn()} title="Закрито">
        x
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
