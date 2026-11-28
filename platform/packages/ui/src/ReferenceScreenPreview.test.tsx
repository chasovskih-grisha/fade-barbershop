import { fireEvent, render, screen } from '@testing-library/react';
import { ReferenceScreenPreview } from './ReferenceScreenPreview';

const HARDCODED_PALETTE = /(?:bg|text|border)-(?:white|black|zinc|gray|slate|neutral)-\d{2,3}/;

describe('ReferenceScreenPreview', () => {
  it('renders the web home screen with tokens, no hard-coded palette', () => {
    render(<ReferenceScreenPreview screenType="web-home" data-testid="preview" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Стрижка поруч із домом' })).toBeTruthy();
    const services = screen.getByTestId('web-home-services');
    expect(services.children).toHaveLength(3);
    expect(services.className).toContain('sm:grid-cols-2');
    expect(services.className).toContain('lg:grid-cols-3');
    expect(screen.getByTestId('preview').innerHTML).not.toMatch(HARDCODED_PALETTE);
    expect(screen.getByTestId('preview').className).toContain('bg-surface-base');
  });

  it('renders the admin shell with navigation, search and visit statuses', () => {
    render(<ReferenceScreenPreview screenType="admin-shell" />);

    expect(screen.getByRole('navigation', { name: 'Розділи адмінки' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Пошук клієнта' })).toBeTruthy();
    expect(screen.getAllByRole('status').map((pill) => pill.textContent)).toEqual([
      'Підтверджено',
      'В процесі',
      'Заброньовано',
    ]);
    expect(screen.getByText('11:30')).toBeTruthy();
  });

  it('lets the slot flow pick a free slot and keeps busy ones disabled', () => {
    render(<ReferenceScreenPreview screenType="slot-flow" />);

    expect(screen.getByRole('list', { name: 'Кроки запису' })).toBeTruthy();
    const busy = screen.getByRole('button', { name: '10:30' });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /11:30/ }));
    expect(screen.getByText('Обрано: 11:30')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Підтвердити' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders the mobile home inside a narrow frame', () => {
    render(<ReferenceScreenPreview screenType="mobile-home" />);

    expect(screen.getByText('Київ, вул. Антоновича 12')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Послуги поруч' }).children).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Записатися' }).className).toContain('w-full');
  });

  it('keeps every screen responsive and token-driven at the wrapper level', () => {
    render(
      <>
        {(['web-home', 'admin-shell', 'slot-flow', 'mobile-home'] as const).map((type) => (
          <ReferenceScreenPreview key={type} screenType={type} data-testid={type} />
        ))}
      </>
    );

    for (const type of ['web-home', 'admin-shell', 'slot-flow', 'mobile-home'] as const) {
      const wrapper = screen.getByTestId(type);
      expect(wrapper.className).toContain('sm:p-6');
      expect(wrapper.className).toContain('lg:p-8');
      expect(wrapper.className).toContain('bg-surface-base');
    }
  });
});
