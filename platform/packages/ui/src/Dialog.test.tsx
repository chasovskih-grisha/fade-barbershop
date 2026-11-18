import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dialog } from './Dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Відкрити
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Заголовок"
        description="Опис"
        footer={<button type="button">Ок</button>}
      >
        <button type="button">Дія</button>
      </Dialog>
    </div>
  );
}

const openDialog = () => {
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Відкрити' });
  trigger.focus();
  fireEvent.click(trigger);
};

describe('Dialog', () => {
  it('відкривається з accessible name і фокусом усередині', () => {
    openDialog();
    expect(screen.getByRole('dialog', { name: 'Заголовок' })).toBeTruthy();
    expect(screen.getByText('Опис')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити' }));
  });

  it('закривається на Escape', () => {
    openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('закривається кліком по фону', () => {
    openDialog();
    fireEvent.click(screen.getByTestId('dialog-overlay'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('закривається кнопкою і повертає фокус на тригер', () => {
    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Відкрити' }));
  });

  it('зациклює Tab з останнього на перший', () => {
    openDialog();
    screen.getByRole('button', { name: 'Ок' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити' }));
  });

  it('зациклює Shift+Tab з першого на останній', () => {
    openDialog();
    screen.getByRole('button', { name: 'Закрити' }).focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ок' }));
  });

  it('не перехоплює Tab усередині і сторонні клавіші', () => {
    openDialog();
    screen.getByRole('button', { name: 'Закрити' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити' }));
    fireEvent.keyDown(document, { key: 'a' });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('блокує і відновлює скрол body', () => {
    const original = document.body.style.overflow;
    openDialog();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe(original);
  });
});
