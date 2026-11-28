import { render, screen } from '@testing-library/react';
import { LocationDirections, mapEmbed, mapLink } from '../LocationDirections';

// T-4835a: замість вигаданих метро/парковки/кави — адреса, одна точка на
// карті за координатами й посилання в карти.

const lat = 50.4623;
const lng = 30.5188;

describe('Напрямки локації (T-4835a)', () => {
  it('посилання й карта будуються з координат', () => {
    expect(mapLink(lat, lng)).toBe(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    );
    expect(mapEmbed(lat, lng)).toContain(`marker=${lat}%2C${lng}`);
  });

  it('показує адресу, точку на карті й посилання', () => {
    render(<LocationDirections address="Нижній Вал 12" lat={lat} lng={lng} />);

    expect(screen.getByText('Нижній Вал 12')).toBeTruthy();
    const map = screen.getByTitle('Карта: Нижній Вал 12') as HTMLIFrameElement;
    expect(map.getAttribute('src')).toContain(`marker=${lat}%2C${lng}`);
    const link = screen.getByRole('link', { name: 'Відкрити в картах' }) as HTMLAnchorElement;
    expect(link.href).toBe(mapLink(lat, lng));
  });

  it('не вигадує метро, парковку чи каву', () => {
    const { container } = render(<LocationDirections address="Нижній Вал 12" lat={lat} lng={lng} />);
    for (const invented of ['метро', 'Парковка', 'кава', '5-7 хвилин']) {
      expect(container.textContent ?? '').not.toContain(invented);
    }
  });
});
