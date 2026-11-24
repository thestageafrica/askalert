'use client';

import { useState } from 'react';
import { scorePassword } from '@askalert/db';
import { Input, cn } from '@askalert/ui';

export function PasswordField({
  label = 'Password',
  value,
  onChange,
  showStrength = false,
  autoComplete = 'current-password',
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const strength = scorePassword(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          label={label}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-[2.15rem] min-h-11 min-w-11 text-xs font-bold text-orange-700 dark:text-orange-400"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showStrength && value ? (
        <div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  strength.score > step ? 'bg-orange-500' : 'bg-border',
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {strength.label}
            {strength.hints[0] ? ` · ${strength.hints[0]}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}
