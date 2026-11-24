'use client';

import Link from 'next/link';
import type { ConsentInput } from '@askalert/db';

export function ConsentFields({
  value,
  onChange,
}: {
  value: ConsentInput[];
  onChange: (next: ConsentInput[]) => void;
}) {
  const setGranted = (type: ConsentInput['type'], granted: boolean) => {
    onChange(
      value.map((item) => (item.type === type ? { ...item, granted } : item)),
    );
  };

  const terms = value.find((item) => item.type === 'terms')?.granted ?? false;
  const privacy = value.find((item) => item.type === 'privacy')?.granted ?? false;
  const whatsapp = value.find((item) => item.type === 'whatsapp_optin')?.granted ?? false;
  const marketing = value.find((item) => item.type === 'marketing')?.granted ?? false;

  return (
    <div className="space-y-3 text-sm">
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-orange-500"
          checked={terms}
          onChange={(event) => setGranted('terms', event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link href="/terms/" className="font-semibold text-orange-700 underline-offset-2 hover:underline dark:text-orange-400">
            Terms
          </Link>
          . Required.
        </span>
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-orange-500"
          checked={privacy}
          onChange={(event) => setGranted('privacy', event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link href="/privacy/" className="font-semibold text-orange-700 underline-offset-2 hover:underline dark:text-orange-400">
            Privacy Policy
          </Link>
          . Required.
        </span>
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-orange-500"
          checked={whatsapp}
          onChange={(event) => setGranted('whatsapp_optin', event.target.checked)}
        />
        <span>Optional. Message me on WhatsApp about my requests when that channel is live.</span>
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-orange-500"
          checked={marketing}
          onChange={(event) => setGranted('marketing', event.target.checked)}
        />
        <span>Optional. Send me product tips and Lagos launch updates.</span>
      </label>
    </div>
  );
}

export function defaultConsentState(): ConsentInput[] {
  return [
    { type: 'terms', granted: false },
    { type: 'privacy', granted: false },
    { type: 'whatsapp_optin', granted: false },
    { type: 'marketing', granted: false },
  ];
}
