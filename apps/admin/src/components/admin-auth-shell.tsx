'use client';

import type { ReactNode } from 'react';
import { Logo } from '@askalert/ui';
import { AdminAuthSlideshow } from './admin-auth-slideshow';

const formCardClassName = [
  'w-full max-w-md rounded-[1.75rem] border border-surface/20 bg-surface p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-8',
  'lg:border-transparent lg:shadow-[0_32px_90px_rgba(0,0,0,0.5)]',
  '[&_input]:bg-surface [&_input]:text-navy-900 [&_input]:placeholder:text-navy-900/40',
  'dark:[&_input]:bg-surface dark:[&_input]:text-navy-900 dark:[&_input]:placeholder:text-navy-900/40',
  '[&_label]:text-navy-900',
].join(' ');

export function AdminAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-950 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:overflow-hidden">
      <div className="relative hidden h-dvh lg:block">
        <AdminAuthSlideshow contentAlign="middle" className="h-full min-h-0" />
      </div>

      <div className="relative flex min-h-screen flex-col lg:h-dvh lg:min-h-0 lg:overflow-y-auto">
        <div className="shrink-0 lg:hidden">
          <AdminAuthSlideshow compact className="h-[40vh] min-h-[15.5rem] max-h-[22rem]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-4 pb-10 sm:px-6 lg:justify-center lg:px-10 lg:py-12 xl:px-14">
          <div
            className={[
              '-mt-8 self-center sm:-mt-10 lg:mt-0 lg:max-w-md lg:self-stretch',
              formCardClassName,
            ].join(' ')}
          >
            <Logo className="h-9 w-auto" />
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-navy-900/65">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 hidden text-center text-xs text-surface/55 lg:block lg:max-w-md">
            AskAlert admin · Invitation only
          </p>
        </div>
      </div>
    </div>
  );
}
