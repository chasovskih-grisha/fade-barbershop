import {
  cancellationLines,
  renderCancellationHtml,
  renderCancellationSubject,
  renderCancellationText,
} from './cancellation-confirmation-template';

const FULL = {
  locationName: 'FADE Obolon',
  locationAddress: 'просп. Героїв Сталінграда 12, Київ',
  barberName: 'Alex <test>',
  serviceName: 'Haircut & Beard',
  start: '2026-10-10T12:00:00.000Z',
  cancellationReason: 'Зміна планів клієнта',
};

describe('cancellation-confirmation-template', () => {
  it('рядки: лише наявні дані включно з причиною', () => {
    const lines = cancellationLines(FULL);
    expect(lines).toContainEqual(['Коли', expect.stringContaining('15:00')]);
    expect(lines).toContainEqual(['Де', 'FADE Obolon, просп. Героїв Сталінграда 12, Київ']);
    expect(lines).toContainEqual(['Майстер', 'Alex <test>']);
    expect(lines).toContainEqual(['Послуга', 'Haircut & Beard']);
    expect(lines).toContainEqual(['Причина', 'Зміна планів клієнта']);
  });

  it('без опційних даних — мінімальні рядки', () => {
    const lines = cancellationLines({ start: '2026-10-10T12:00:00.000Z' });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.[0]).toBe('Коли');
  });

  it('нечитабельний час — без рядка «Коли» і без часу в темі', () => {
    const lines = cancellationLines({ start: 'invalid', locationName: 'FADE Obolon' });
    expect(lines.map(([l]) => l)).toEqual(['Де']);
    expect(renderCancellationSubject({ start: 'invalid' })).toBe('FADE: візит скасовано');
  });

  it('тема з часом у Europe/Kyiv', () => {
    expect(renderCancellationSubject(FULL)).toMatch(/^FADE: візит скасовано \(10 жовтня 2026/);
  });

  it('text: усі рядки та попередження', () => {
    const text = renderCancellationText(FULL);
    expect(text).toContain('Коли: ');
    expect(text).toContain('Причина: Зміна планів клієнта');
    expect(text).toContain('зв’яжіться з нами');
    expect(text).not.toContain('<table');
  });

  it('html: екранування користувацьких даних', () => {
    const html = renderCancellationHtml(FULL);
    expect(html).toContain('<table');
    expect(html).toContain('FADE Obolon');
    expect(html).toContain('Alex &lt;test&gt;');
    expect(html).not.toContain('Alex <test>');
  });

  it('бренд замінює FADE у всіх частинах', () => {
    expect(renderCancellationSubject({ start: FULL.start }, 'Fade Club')).toContain('Fade Club:');
    expect(renderCancellationText({ start: FULL.start }, 'Fade Club')).toContain('Fade Club —');
    expect(renderCancellationHtml({ start: FULL.start }, 'Fade Club')).toContain('Fade Club');
  });
});
