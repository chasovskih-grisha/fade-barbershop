// Блоки листа (T-4611b): таблиця «підпис ↔ значення», CTA і текст. Усі
// значення — з email.*, жодного локального кольору чи розміру.
import { escapeAttribute, escapeHtml } from './email-escape';
import { emailTokens } from './email-tokens';

export interface EmailTableRow {
  label: string;
  value: string;
}

export function emailTable(rows: EmailTableRow[]): string {
  const t = emailTokens();
  const trs = rows
    .map(
      (row) => `
<tr>
<td style="padding:10px 0;border-bottom:1px solid ${t.border};font-size:${t.fontSizeBody};color:${t.textSecondary};width:40%;">${escapeHtml(
        row.label
      )}</td>
<td style="padding:10px 0;border-bottom:1px solid ${t.border};font-size:${t.fontSizeBody};color:${t.textPrimary};font-weight:500;text-align:right;width:60%;">${escapeHtml(
        row.value
      )}</td>
</tr>
`
    )
    .join('');

  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:${t.spacing};">
${trs}
</table>`;
}

export function emailButton(label: string, href: string): string {
  const t = emailTokens();
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:${t.spacing} 0;">
<tr>
<td align="center" style="border-radius:${t.radius};background-color:${t.accentSolid};">
<a href="${escapeAttribute(
    href
  )}" target="_blank" style="font-size:${t.fontSizeBody};font-family:${t.fontStack};color:${t.accentOnSolid};text-decoration:none;padding:12px 24px;border-radius:${t.radius};border:1px solid ${t.accentSolid};display:inline-block;font-weight:600;">
${escapeHtml(label)}
</a>
</td>
</tr>
</table>`;
}

export function emailText(
  text: string,
  variant: 'primary' | 'secondary' | 'caption' = 'primary'
): string {
  const t = emailTokens();
  const color = variant === 'secondary' ? t.textSecondary : t.textPrimary;
  const fontSize = variant === 'caption' ? t.fontSizeCaption : t.fontSizeBody;
  return `<p style="margin:0 0 ${t.spacing};font-size:${fontSize};line-height:1.5;color:${color};">${escapeHtml(
    text
  )}</p>`;
}
