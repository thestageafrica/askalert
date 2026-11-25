import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAuthEmails } from './render';
import type { AuthEmailHookPayload, EmailActionType } from './types';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, '..', 'preview');

const actions: EmailActionType[] = [
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
  'reauthentication',
];

function sample(action: EmailActionType): AuthEmailHookPayload {
  return {
    user: {
      id: '8484b834-f29e-4af2-bf42-80644d154f76',
      email: 'preview@askalert.com',
      new_email: action === 'email_change' ? 'new@askalert.com' : undefined,
    },
    email_data: {
      token: '305805',
      token_hash: `hash_${action}`,
      redirect_to: 'https://www.askalert.com/auth/callback/',
      email_action_type: action,
      site_url: 'https://www.askalert.com',
      token_new: action === 'email_change' ? '654321' : '',
      token_hash_new: action === 'email_change' ? 'hash_current' : '',
      old_email: '',
    },
  };
}

mkdirSync(outDir, { recursive: true });

const indexRows: string[] = [];

for (const action of actions) {
  const mails = renderAuthEmails(sample(action), {
    supabaseUrl: 'https://krrvatcjgytdbsiyvqyh.supabase.co',
    siteUrl: 'https://www.askalert.com',
    logoUrl: 'https://www.askalert.com/brand/askalert-logo-email.png',
  });

  mails.forEach((mail, index) => {
    const base = mails.length > 1 ? `${action}-${index + 1}` : action;
    writeFileSync(join(outDir, `${base}.html`), mail.html, 'utf8');
    writeFileSync(join(outDir, `${base}.txt`), mail.text, 'utf8');
    indexRows.push(`<li><a href="./${base}.html">${mail.subject}</a></li>`);
  });
}

writeFileSync(
  join(outDir, 'index.html'),
  `<!DOCTYPE html><html><body><h1>AskAlert auth email preview</h1><ul>${indexRows.join('')}</ul></body></html>`,
  'utf8',
);

console.log(`Wrote ${indexRows.length} preview files to ${outDir}`);
