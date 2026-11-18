// Каркас листа (T-4611b): preheader, картка, max-width, таблична сітка.
// Кольори й розміри — лише з email.*; жодного зовнішнього ресурсу.
import { escapeHtml } from './email-escape';
import { emailTokens } from './email-tokens';

export interface EmailLayoutOptions {
  preheader?: string;
  title?: string;
  body: string;
  footer?: string;
}

export function emailLayout(options: EmailLayoutOptions): string {
  const t = emailTokens();

  const preheaderHtml = options.preheader
    ? `<div style="display:none;font-size:1px;color:${t.bg};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(
        options.preheader
      )}</div>`
    : '';

  const titleHtml = options.title
    ? `<h1 style="margin:0 0 ${t.spacing} 0;font-size:${t.fontSizeTitle};font-weight:600;color:${t.textPrimary};line-height:1.3;">${escapeHtml(
        options.title
      )}</h1>`
    : '';

  const footerHtml = options.footer
    ? `<div style="margin-top:${t.spacing};padding-top:${t.spacing};border-top:1px solid ${t.border};font-size:${t.fontSizeCaption};color:${t.textSecondary};line-height:1.4;text-align:center;">${options.footer}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(options.title || 'FADE')}</title>
</head>
<body style="margin:0;padding:0;background-color:${t.bg};font-family:${t.fontStack};font-size:${t.fontSizeBody};color:${t.textPrimary};">
${preheaderHtml}
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${t.bg};table-layout:fixed;">
<tr>
<td align="center" style="padding:${t.spacing};">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${t.surface};border:1px solid ${t.border};border-radius:${t.radius};">
<tr>
<td style="padding:${t.spacing};">
${titleHtml}
${options.body}
${footerHtml}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}
