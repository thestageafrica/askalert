'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { requiredConsentsGranted, scorePassword } from '@askalert/db';
import { Button, Input } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { ConsentFields, defaultConsentState } from '../../../components/auth/consent-fields';
import { PasswordField } from '../../../components/auth/password-field';
import { useAuth } from '../../../lib/auth/auth-provider';
import { phoneHintError } from '../../../lib/auth/phone';

export default function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [consents, setConsents] = useState(defaultConsentState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!displayName.trim()) {
      setError('Add your name.');
      return;
    }
    const phoneError = phoneHintError(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!scorePassword(password).ok) {
      setError('Choose a stronger password.');
      return;
    }
    if (!requiredConsentsGranted(consents)) {
      setError('Accept the Terms and Privacy Policy to continue.');
      return;
    }
    setLoading(true);
    const result = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      phone,
      consents,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/auth/check-email/?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Continue as a buyer. You can become a vendor later from the same account."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/auth/sign-in/" className="font-bold text-orange-700 dark:text-orange-400">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <Input
          label="Display name"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="WhatsApp number"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          hint="Nigeria default (+234). We will ask you to verify on WhatsApp when that channel is live."
        />
        <PasswordField
          value={password}
          onChange={setPassword}
          showStrength
          autoComplete="new-password"
        />
        <ConsentFields value={consents} onChange={setConsents} />
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button className="w-full" loading={loading} onClick={() => void onSubmit()}>
          Continue as buyer
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          loading={loading}
          onClick={() =>
            void signInWithGoogle().then((result) => {
              if (result.error) {
                setError(result.error);
              }
            })
          }
        >
          Continue with Google
        </Button>
        <p className="text-xs text-muted-foreground">
          Phone stays unverified for now. You will see “Verify your WhatsApp number” as a pending
          step after sign-in.
        </p>
      </div>
    </AuthShell>
  );
}
