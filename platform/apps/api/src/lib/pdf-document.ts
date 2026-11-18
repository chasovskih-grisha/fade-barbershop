// Мінімальний генератор PDF (PDF 1.4, Helvetica) для звітів адмінки.
//
// Навіщо свій: pdfkit — важка нативна залежність, якої немає в дереві
// репозиторію, а звітам T-181 потрібен лише текст із заголовками та лінійкою.
// Клас повторює ту частину API pdfkit, яку використовують звіти
// (fontSize/text/moveDown/moveTo/lineTo/stroke/pipe/end), тож код звіту
// лишається читабельним.

import { Writable } from 'node:stream';

export interface PdfDocumentOptions {
  margin?: number;
  size?: string;
}

interface PageSize {
  width: number;
  height: number;
}

const PAGE_SIZES: Record<string, PageSize> = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
};

export class PdfDocument {
  private readonly margin: number;
  readonly page: PageSize;
  private y: number;
  private ops: string[] = [];
  private size = 12;
  private target: Writable | null = null;
  private finished = false;

  constructor(options: PdfDocumentOptions = {}) {
    this.margin = options.margin ?? 50;
    this.page = PAGE_SIZES[(options.size ?? 'A4').toUpperCase()] ?? PAGE_SIZES.A4;
    this.y = this.page.height - this.margin;
  }

  /** Розмір шрифту для наступних `text`. */
  fontSize(size: number): this {
    this.size = size;
    return this;
  }

  /** Рядок тексту; `align: 'center'` центрує по ширині сторінки. */
  text(value: string, options: { align?: 'left' | 'center' | 'right'; underline?: boolean } = {}): this {
    const lines = String(value ?? '').split('\n');
    for (const line of lines) {
      this.ensureRoom(this.size * 1.4);
      const width = this.measure(line);
      let x = this.margin;
      if (options.align === 'center') x = Math.max(this.margin, (this.page.width - width) / 2);
      if (options.align === 'right') x = this.page.width - this.margin - width;

      this.ops.push(
        `BT /F1 ${this.size} Tf ${x.toFixed(2)} ${this.y.toFixed(2)} Td (${escapePdfText(line)}) Tj ET`
      );
      if (options.underline) {
        this.line(x, this.y - 2, x + width, this.y - 2);
      }
      this.y -= this.size * 1.4;
    }
    return this;
  }

  /** Порожній рядок висотою `n` поточних шрифтів. */
  moveDown(n = 1): this {
    this.y -= this.size * 1.4 * n;
    return this;
  }

  moveTo(x: number, y: number): this {
    this.pendingLine = { x, y };
    return this;
  }

  lineTo(x: number, y: number): this {
    if (this.pendingLine) this.line(this.pendingLine.x, this.pendingLine.y, x, y);
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number): this {
    this.ops.push(
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
    return this;
  }

  stroke(): this {
    this.ops.push('S');
    this.pendingLine = null;
    return this;
  }

  /** Куди писати готовий PDF (fs.WriteStream сумісний). */
  pipe(target: Writable): this {
    this.target = target;
    return this;
  }

  /** Формує байти документа і віддає в `pipe`-приймач. */
  end(): void {
    if (this.finished) return;
    this.finished = true;
    const bytes = this.build();
    this.target?.write(bytes);
    // fs.WriteStream закриється сам; generic Writable теж це підтримує.
    this.target?.end?.();
  }

  /** Самодостатній PDF як Buffer (для тестів і HTTP-відповідей). */
  toBuffer(): Buffer {
    return this.build();
  }

  private pendingLine: { x: number; y: number } | null = null;

  private ensureRoom(height: number): void {
    if (this.y - height >= this.margin) return;
    // Одна сторінка звіту: переносимо курсор на початок нової.
    this.y = this.page.height - this.margin;
  }

  /** Ширина тексту в Helvetica (наближено 0.5em на символ). */
  private measure(text: string): number {
    return text.length * this.size * 0.5;
  }

  private build(): Buffer {
    const content = this.ops.join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.page.width} ${this.page.height}] ` +
        '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ];

    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(out, 'latin1'));
      out += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefStart = Buffer.byteLength(out, 'latin1');
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`;
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(out, 'latin1');
  }
}

/** Екранує дужки та бекслеші — інакше PDF-рядок ламається. */
function escapePdfText(text: string): string {
  return text.replace(/[\\()]/g, (char) => `\\${char}`);
}
