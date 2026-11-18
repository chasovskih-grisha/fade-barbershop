// Шаблон листа підтвердження (T-4608): детермінований рендер, умовні рядки
// (лише наявні дані), екранування HTML, узгодженість text/HTML/теми.
import { confirmationLines, renderConfirmationHtml, renderConfirmationSubject, renderConfirmationText } from './booking-confirmation-template';

const FULL = {
  locationName: 'FADE Podil',
  locationAddress: 'вул. Верхній Вал 28, Київ',
  barberName: 'Oleh <test>',
  serviceName: 'Haircut',
  start: '2026-10-05T10:00:00.000Z',
};

describe('booking-confirmation-template (T-4608)', () => {
  it('рядки: лише наявні дані, «Де» = імʼя + адреса', () => {
    const lines = confirmationLines(FULL);
    expect(lines).toContainEqual(['Коли', expect.stringContaining('13:00')]);
    expect(lines).toContainEqual(['Де', 'FADE Podil, вул. Верхній Вал 28, Київ']);
    expect(lines).toContainEqual(['Майстер', 'Oleh <test>']);
    expect(lines).toContainEqual(['Послуга', 'Haircut']);
  });

  it('без опційних даних — без відповідних рядків (мінімум: лише «Коли»)', () => {
    const lines = confirmationLines({ start: '2026-10-05T10:00:00.000Z' });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.[0]).toBe('Коли');
  });

  it('нечитабельний час — без рядка «Коли» і без часу в темі', () => {
    const lines = confirmationLines({ start: 'not-a-date', locationName: 'FADE Podil' });
    expect(lines.map(([l]) => l)).toEqual(['Де']);
    expect(renderConfirmationSubject({ start: 'not-a-date' })).toBe('FADE: візит записано');
  });

  it('тема з часом у Europe/Kyiv', () => {
    expect(renderConfirmationSubject(FULL)).toMatch(/^FADE: візит записано \(5 жовтня 2026/);
  });

  it('text: усі рядки + підпис, сирі дані (без HTML-екранування)', () => {
    const text = renderConfirmationText(FULL);
    expect(text).toContain('Коли: ');
    expect(text).toContain('Де: FADE Podil, вул. Верхній Вал 28, Київ');
    expect(text).toContain('Майстер: Oleh <test>');
    expect(text).toContain('зателефонуйте');
    expect(text).not.toContain('<table');
  });

  it('html: ті самі дані, екранування користувацьких даних', () => {
    const html = renderConfirmationHtml(FULL);
    expect(html).toContain('<table');
    expect(html).toContain('FADE Podil');
    // користувацький рядок екрановано — сирого <test> у DOM нема
    expect(html).toContain('Oleh &lt;test&gt;');
    expect(html).not.toContain('Oleh <test>');
  });

  it('бренд замінює FADE у всіх частинах', () => {
    expect(renderConfirmationSubject({ start: FULL.start }, 'Fade Podil')).toContain('Fade Podil:');
    expect(renderConfirmationText({ start: FULL.start }, 'Fade Podil')).toContain('Fade Podil —');
    expect(renderConfirmationHtml({ start: FULL.start }, 'Fade Podil')).toContain('Fade Podil —');
  });
});
