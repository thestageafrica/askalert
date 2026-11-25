export type LayoutInput = {
  logoUrl: string;
  siteUrl: string;
  preheader: string;
  headline: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  code?: string;
  footerNote: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderAuthEmailHtml(input: LayoutInput): string {
  const logoUrl = escapeHtml(input.logoUrl);
  const siteUrl = escapeHtml(input.siteUrl);
  const headline = escapeHtml(input.headline);
  const intro = escapeHtml(input.intro);
  const footerNote = escapeHtml(input.footerNote);
  const preheader = escapeHtml(input.preheader);

  const ctaBlock =
    input.ctaLabel && input.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0;">
          <tr>
            <td align="center" bgcolor="#ff7500" style="border-radius:999px;">
              <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0f1545;text-decoration:none;border-radius:999px;">
                ${escapeHtml(input.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px 0;font-size:13px;line-height:1.55;color:#5b628a;">
          If the button does not work, paste this link into your browser:
        </p>
        <p style="margin:0 0 20px 0;font-size:12px;line-height:1.5;word-break:break-all;">
          <a href="${escapeHtml(input.ctaUrl)}" style="color:#ff7500;text-decoration:underline;">${escapeHtml(input.ctaUrl)}</a>
        </p>`
      : '';

  const codeBlock = input.code
    ? `<p style="margin:0 0 20px 0;font-size:28px;letter-spacing:0.18em;font-weight:800;color:#0f1545;">${escapeHtml(input.code)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${headline}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f1545;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e3e6f0;">
            <tr>
              <td style="padding:28px 28px 16px 28px;background:#0a0f33;">
                <img src="${logoUrl}" width="168" height="36" alt="AskAlert" style="display:block;border:0;outline:none;text-decoration:none;height:36px;width:auto;max-width:180px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#ff7500;">
                  Ask. Alert. Delivered.
                </p>
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;color:#0f1545;">${headline}</h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#1d2468;">${intro}</p>
                ${codeBlock}
                ${ctaBlock}
                <p style="margin:0;font-size:12px;line-height:1.55;color:#5b628a;">${footerNote}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px 28px;background:#f6f7fb;border-top:1px solid #e3e6f0;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#0f1545;">AskAlert</p>
                <p style="margin:0 0 10px 0;font-size:12px;line-height:1.5;color:#5b628a;">
                  Lekki, Lagos · Verified vendors · Staged payouts
                </p>
                <p style="margin:0;font-size:11px;line-height:1.5;color:#8a90b0;">
                  AskAlert Technologies Limited ·
                  <a href="${siteUrl}" style="color:#8a90b0;text-decoration:underline;">${siteUrl.replace(/^https?:\/\//, '')}</a>
                  ·
                  <a href="${siteUrl}/privacy/" style="color:#8a90b0;text-decoration:underline;">Privacy</a>
                  ·
                  <a href="${siteUrl}/terms/" style="color:#8a90b0;text-decoration:underline;">Terms</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderAuthEmailText(input: LayoutInput): string {
  const lines = [
    input.headline,
    '',
    input.intro,
    '',
  ];
  if (input.code) {
    lines.push(`Code: ${input.code}`, '');
  }
  if (input.ctaUrl) {
    lines.push(`${input.ctaLabel ?? 'Continue'}: ${input.ctaUrl}`, '');
  }
  lines.push(input.footerNote, '', 'AskAlert · Lekki, Lagos', input.siteUrl);
  return lines.join('\n');
}
