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
      <Dialog open={open} onClose={() => setOpen(false)} title="Заголовок">
        <button type="button">Дія</button>
      </Dialog>
    </div>
  );
}

const stubMatchMedia = (matches: boolean) => {
  (window as unknown as { matchMedia: unknown }).matchMedia = () => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
};

const openDialog = () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Відкрити' }));
};

describe('Dialog · prefers-reduced-motion (T-4510c)', () => {
  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('зводить анімацію входу нанівець, коли рух скорочено', () => {
    stubMatchMedia(true);
    openDialog();
    const panel = screen.getByTestId('dialog-panel');
    expect(panel.style.transitionDuration).toBe('0ms');
    expect(panel.style.transform).toBe('none');
    expect(screen.getByTestId('dialog-overlay').style.transitionDuration).toBe('0ms');
  });

  it('анімує вхід, коли рух дозволено', () => {
    stubMatchMedia(false);
    openDialog();
    expect(screen.getByTestId('dialog-panel').style.transitionDuration).toBe('200ms');
  });
});
