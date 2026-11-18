import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminShell from './AdminShell';

/** Вузький вьюпорт: нижче `lg` бургер видимий, а Sheet має право відкритися. */
export function setNarrowViewport() {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 480 });
}

/** Авторизований адмін у каркасі + бургер мобільного меню. */
export async function renderShell(): Promise<{
  burger: HTMLElement;
  rerender: (ui: ReactElement) => void;
}> {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ phone: 'admin' }),
  });
  setNarrowViewport();
  const view = render(
    <AdminShell>
      <main>Вміст сторінки</main>
    </AdminShell>
  );
  const burger = await screen.findByRole('button', { name: 'Відкрити меню навігації' });
  return { burger, rerender: view.rerender };
}

/** Бургер → відкритий Sheet. */
export async function openDrawer() {
  const { burger } = await renderShell();
  fireEvent.click(burger);
  return screen.findByRole('dialog', { name: 'Навігація' });
}
