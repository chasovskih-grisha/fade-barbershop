import { render } from '@testing-library/react';
import LocationChannels from '../LocationChannels';
import { LocationPhoneLink } from '../LocationPhoneLink';

// T-4833a: телефон студії — один tel-контрол у рядку дій; решта каналів —
// ряд іменованих контролів зі своїми href; порожній список не рендериться.

const phoneChannel = { channel: 'phone' as const, value: '+380 67 111 22 33', sortOrder: 0 };
const instagram = { channel: 'instagram' as const, value: 'fade.studio', sortOrder: 1 };

type Channel = typeof phoneChannel | typeof instagram;

const contacts = (phone: string | null, channels: Channel[]) =>
  render(
    <div>
      <LocationPhoneLink phone={phone} channels={channels as never} />
      <LocationChannels channels={channels as never} />
    </div>
  );

describe('Контакти студії (T-4833a)', () => {
  it('канал phone дає один tel-контрол і не відкриває другий блок', () => {
    const { container } = contacts(null, [phoneChannel]);
    const links = [...container.querySelectorAll('a')];

    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('tel:+380671112233');
    expect(container.textContent).toBe('+380 67 111 22 33');
  });

  it('номер показуємо один раз, Instagram — іменований контрол зі своїм href', () => {
    const { container } = contacts('+380 50 000 00 00', [phoneChannel, instagram]);
    const links = [...container.querySelectorAll('a')];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'tel:+380671112233',
      'https://instagram.com/fade.studio',
    ]);
    expect(container.textContent).toContain('Instagram');
    expect(container.textContent).not.toContain('+380 50 000 00 00');
  });

  it('без каналу phone бере location.phone один раз', () => {
    const { container } = contacts('+380 44 123 45 67', [instagram]);

    expect(container.querySelector('a[href^="tel:"]')?.getAttribute('href')).toBe(
      'tel:+380441234567'
    );
  });

  it('без каналів регіон контактів не рендериться', () => {
    const { container } = contacts(null, []);

    expect(container.textContent).toBe('');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});
