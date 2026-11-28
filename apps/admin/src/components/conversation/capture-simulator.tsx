'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CAPTURE_STEPS,
  advanceCapture,
  startCapture,
  summarizeDraft,
  toPlainTextFallback,
  type CaptureOutbound,
  type CaptureSession,
  type CaptureStep,
} from '@askalert/conversation';
import { findCatalogSeedBySlug } from '@askalert/catalog';
import { findNode, buildGeoLookup, listGeoSeedNodes } from '@askalert/geo';
import { Button, Input, cn } from '@askalert/ui';

type ChatBubble = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  outbound?: CaptureOutbound;
};

const PRESETS = [
  {
    id: 'wedding-lekki',
    label: 'Wedding · Lekki',
    hint: 'Multi-service English',
    text: 'Need catering and a photographer for a wedding in Lekki Phase 1, 150 guests, 20 December',
  },
  {
    id: 'pcm-jollof',
    label: 'Pidgin · jollof',
    hint: 'Free-text Pidgin',
    text: 'Abeg I need jollof for wedding for 120 guests for Lekki',
  },
  {
    id: 'vi-short',
    label: 'VI short ask',
    hint: 'Compressed ask',
    text: 'Wedding catering in VI 100 guests 12 Dec',
  },
  {
    id: 'cleaner',
    label: 'Home care',
    hint: 'Category edge case',
    text: 'Need a cleaner in Lekki Phase 1 tomorrow',
  },
  {
    id: 'cancel-path',
    label: 'Guided taps',
    hint: 'Start empty',
    text: '',
  },
] as const;

const FLOW_STEPS = CAPTURE_STEPS.filter(
  (step) => step !== 'done' && step !== 'cancelled',
) as CaptureStep[];

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function draftCompleteness(session: CaptureSession): number {
  const checks = [
    Boolean(session.draft.categorySlug),
    Boolean(session.draft.typeSlug),
    session.draft.items.length > 0,
    Boolean(session.draft.startDate),
    Boolean(session.draft.locationSlug),
    session.draft.budgetMaxMinor != null,
    Boolean(session.draft.involvement),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function stepIndex(step: CaptureStep): number {
  if (step === 'done') {
    return FLOW_STEPS.length;
  }
  if (step === 'cancelled') {
    return -1;
  }
  return FLOW_STEPS.indexOf(step);
}

export function CaptureSimulator() {
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [draftText, setDraftText] = useState('');
  const [lastOutbound, setLastOutbound] = useState<CaptureOutbound[]>([]);
  const [showPayload, setShowPayload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const geoLookup = useMemo(() => buildGeoLookup(listGeoSeedNodes()), []);

  useEffect(() => {
    const started = startCapture();
    setSession(started.session);
    setLastOutbound(started.outbound);
    setBubbles(
      started.outbound.map((message: CaptureOutbound, index: number) => ({
        id: `a0_${index}`,
        role: 'assistant' as const,
        text: toPlainTextFallback(message),
        outbound: message,
      })),
    );
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [bubbles, isTyping]);

  const pushResult = (
    userText: string | null,
    nextSession: CaptureSession,
    outbound: CaptureOutbound[],
  ) => {
    setSession(nextSession);
    setLastOutbound(outbound);
    setBubbles((current) => {
      const next = [...current];
      if (userText) {
        next.push({
          id: `u_${Date.now()}`,
          role: 'user',
          text: userText,
        });
      }
      for (const [index, message] of outbound.entries()) {
        next.push({
          id: `a_${Date.now()}_${index}`,
          role: 'assistant',
          text: toPlainTextFallback(message),
          outbound: message,
        });
      }
      return next;
    });
  };

  const withTyping = (run: () => void) => {
    setIsTyping(true);
    window.setTimeout(() => {
      run();
      setIsTyping(false);
    }, 280);
  };

  const sendText = (text: string) => {
    if (!session || !text.trim()) {
      return;
    }
    const trimmed = text.trim();
    withTyping(() => {
      const result = advanceCapture(session, { kind: 'text', text: trimmed });
      pushResult(trimmed, result.session, result.outbound);
      setDraftText('');
    });
  };

  const sendTap = (id: string, title?: string) => {
    if (!session) {
      return;
    }
    withTyping(() => {
      const result = advanceCapture(session, { kind: 'tap', id, title });
      pushResult(title ?? id, result.session, result.outbound);
    });
  };

  const restart = () => {
    const started = startCapture();
    setSession(started.session);
    setLastOutbound(started.outbound);
    setBubbles(
      started.outbound.map((message: CaptureOutbound, index: number) => ({
        id: `restart_${index}`,
        role: 'assistant' as const,
        text: toPlainTextFallback(message),
        outbound: message,
      })),
    );
    setDraftText('');
    setIsTyping(false);
  };

  const runPreset = (preset: (typeof PRESETS)[number]) => {
    const started = startCapture();
    setSession(started.session);
    setLastOutbound(started.outbound);
    setBubbles(
      started.outbound.map((message: CaptureOutbound, index: number) => ({
        id: `preset_${preset.id}_${index}`,
        role: 'assistant' as const,
        text: toPlainTextFallback(message),
        outbound: message,
      })),
    );
    setDraftText('');
    if (!preset.text) {
      setIsTyping(false);
      return;
    }
    withTyping(() => {
      const result = advanceCapture(started.session, {
        kind: 'text',
        text: preset.text,
      });
      setSession(result.session);
      setLastOutbound(result.outbound);
      setBubbles((current) => [
        ...current,
        {
          id: `preset_u_${preset.id}`,
          role: 'user' as const,
          text: preset.text,
        },
        ...result.outbound.map((message: CaptureOutbound, index: number) => ({
          id: `preset_a_${preset.id}_${index}`,
          role: 'assistant' as const,
          text: toPlainTextFallback(message),
          outbound: message,
        })),
      ]);
    });
  };

  if (!session) {
    return (
      <div
        className="h-[32rem] animate-pulse rounded-[2rem] bg-card-muted"
        aria-busy
      />
    );
  }

  const seed = session.draft.categorySlug
    ? findCatalogSeedBySlug(session.draft.categorySlug)
    : null;
  const location = session.draft.locationSlug
    ? findNode(geoLookup, session.draft.locationSlug)
    : null;
  const complete = draftCompleteness(session);
  const activeStep = stepIndex(session.step);
  const ring = 2 * Math.PI * 42;
  const ringOffset = ring - (complete / 100) * ring;
  const statusLabel =
    session.step === 'done'
      ? 'Ready for matching'
      : session.step === 'cancelled'
        ? 'Cancelled'
        : 'Capturing';

  return (
    <div className="capture-sim space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[radial-gradient(90%_120%_at_0%_0%,_color-mix(in_srgb,var(--orange-500)_22%,transparent),_transparent_55%),radial-gradient(70%_90%_at_100%_0%,_color-mix(in_srgb,var(--navy-700)_18%,transparent),_transparent_50%),linear-gradient(160deg,_color-mix(in_srgb,var(--card)_92%,var(--orange-500)),_var(--card))] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 top-[-3rem] h-56 w-56 rounded-full bg-orange-500/20 blur-3xl capture-sim-orb"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-4rem] left-[20%] h-40 w-40 rounded-full bg-navy-700/20 blur-3xl capture-sim-orb-slow"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
              Prompt 46 · Channel-agnostic capture
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              AskAlert
              <span className="block text-orange-600">capture studio</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              One state machine for WhatsApp, web chat and the agent. Tap replies,
              paste Pidgin, or jump with free text — watch the request assemble live.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[1.5rem] border border-border/50 bg-card/80 px-4 py-3 backdrop-blur-sm">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 100 100" className="h-16 w-16 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="color-mix(in srgb, var(--border) 80%, transparent)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--orange-500)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ringOffset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold text-navy-950 dark:text-surface">
                  {complete}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Draft fill
              </p>
              <p className="text-lg font-extrabold text-foreground">{statusLabel}</p>
              <p className="text-xs text-muted-foreground">
                Step · {session.step.replaceAll('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => runPreset(preset)}
              className="group min-h-11 shrink-0 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-left transition hover:-translate-y-0.5 hover:border-orange-500/50 hover:bg-orange-500/20"
            >
              <span className="block text-xs font-extrabold text-navy-950 dark:text-surface">
                {preset.label}
              </span>
              <span className="block text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                {preset.hint}
              </span>
            </button>
          ))}
          <Button variant="ghost" className="min-h-11 shrink-0" onClick={restart}>
            Reset thread
          </Button>
        </div>
      </header>

      <nav
        aria-label="Capture steps"
        className="overflow-x-auto rounded-[1.25rem] border border-border/60 bg-card px-3 py-3"
      >
        <ol className="flex min-w-max items-center gap-1">
          {FLOW_STEPS.map((step, index) => {
            const done = activeStep > index || session.step === 'done';
            const current = activeStep === index;
            return (
              <li key={step} className="flex items-center gap-1">
                <div
                  className={cn(
                    'flex min-h-10 items-center gap-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-wide transition',
                    done && 'bg-orange-500/15 text-navy-950 dark:text-surface',
                    current && 'bg-orange-500 text-navy-950',
                    !done && !current && 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      current
                        ? 'bg-navy-950 text-surface'
                        : done
                          ? 'bg-orange-500 text-navy-950'
                          : 'bg-border/60',
                    )}
                  >
                    {done && !current ? '✓' : index + 1}
                  </span>
                  <span className="hidden sm:inline">{step.replaceAll('_', ' ')}</span>
                </div>
                {index < FLOW_STEPS.length - 1 ? (
                  <span
                    className={cn(
                      'mx-1 h-px w-4 sm:w-6',
                      done ? 'bg-orange-500/50' : 'bg-border',
                    )}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.85fr)]">
        <section className="relative mx-auto w-full max-w-[34rem] xl:max-w-none">
          <div className="capture-sim-phone overflow-hidden rounded-[2rem] border border-border/70 bg-navy-950 shadow-[0_28px_80px_color-mix(in_srgb,var(--navy-950)_28%,transparent)]">
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4 text-surface">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-sm font-extrabold text-navy-950">
                    AA
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy-950 bg-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold tracking-tight">AskAlert</p>
                  <p className="text-[11px] text-surface/65">
                    Stub WhatsApp · not live Meta API
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-surface/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
                {session.step.replaceAll('_', ' ')}
              </span>
            </div>

            <div
              ref={scrollerRef}
              className="capture-sim-wallpaper h-[28rem] space-y-3 overflow-y-auto px-4 py-4 sm:h-[34rem] sm:px-5"
            >
              {bubbles.map((bubble, index) => (
                <div
                  key={bubble.id}
                  className={cn(
                    'capture-sim-bubble flex',
                    bubble.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                  style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
                >
                  <div
                    className={cn(
                      'max-w-[86%] rounded-[1.2rem] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                      bubble.role === 'user'
                        ? 'rounded-br-md bg-orange-500 text-navy-950'
                        : 'rounded-bl-md border border-border/40 bg-card text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{bubble.text}</p>
                    {bubble.outbound?.kind === 'list' && bubble.outbound.hasMore ? (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        List page {bubble.outbound.page + 1} · more available
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {isTyping ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border/40 bg-card px-3 py-2.5">
                    <span className="capture-sim-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span className="capture-sim-dot h-1.5 w-1.5 rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="capture-sim-dot h-1.5 w-1.5 rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </div>
                </div>
              ) : null}
            </div>

            {lastOutbound.some(
              (message) => message.kind === 'buttons' || message.kind === 'list',
            ) ? (
              <div className="border-t border-surface/10 bg-navy-900/80 px-4 py-3 backdrop-blur-sm">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-surface/55">
                  Quick replies
                </p>
                <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                  {lastOutbound.flatMap((message) => {
                    if (message.kind === 'buttons') {
                      return message.buttons.map((button) => (
                        <button
                          key={button.id}
                          type="button"
                          className="min-h-11 rounded-full border border-orange-500/40 bg-orange-500/15 px-4 text-xs font-bold text-surface transition hover:bg-orange-500 hover:text-navy-950"
                          onClick={() => sendTap(button.id, button.title)}
                        >
                          {button.title}
                        </button>
                      ));
                    }
                    if (message.kind === 'list') {
                      return message.rows.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          className="min-h-11 max-w-full rounded-2xl border border-surface/15 bg-surface/5 px-3 text-left text-xs font-semibold text-surface transition hover:border-orange-500/50 hover:bg-orange-500/15"
                          onClick={() => sendTap(row.id, row.title)}
                        >
                          <span className="block">{row.title}</span>
                          {row.description ? (
                            <span className="block text-[10px] font-medium text-surface/55">
                              {row.description}
                            </span>
                          ) : null}
                        </button>
                      ));
                    }
                    return [];
                  })}
                </div>
              </div>
            ) : null}

            <form
              className="flex gap-2 border-t border-surface/10 bg-navy-950 p-3 sm:p-4"
              onSubmit={(event) => {
                event.preventDefault();
                sendText(draftText);
              }}
            >
              <Input
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Type like a buyer… Pidgin welcome"
                aria-label="Simulator message"
                className="min-h-11 border-surface/15 bg-surface/5 text-surface placeholder:text-surface/40"
              />
              <Button
                type="submit"
                className="min-h-11 shrink-0 px-5"
                disabled={!draftText.trim() || isTyping}
              >
                Send
              </Button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-[0_16px_40px_color-mix(in_srgb,var(--navy-950)_8%,transparent)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">
                  Extracted request
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                  {seed?.category_name ?? 'Waiting for category'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.step === 'done'
                    ? 'Submitted — ready for matching.'
                    : session.step === 'cancelled'
                      ? 'Thread cancelled.'
                      : 'Updates as the conversation fills fields.'}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide',
                  session.step === 'done'
                    ? 'bg-orange-500 text-navy-950'
                    : session.step === 'cancelled'
                      ? 'bg-card-muted text-muted-foreground'
                      : 'bg-orange-500/15 text-navy-950 dark:text-surface',
                )}
              >
                {complete}% filled
              </span>
            </div>

            <dl className="mt-5 grid gap-2">
              <ExtractRow
                label="Type"
                filled={Boolean(session.draft.typeSlug)}
                value={
                  seed?.types.find((type) => type.slug === session.draft.typeSlug)?.name ??
                  session.draft.typeSlug ??
                  '—'
                }
              />
              <ExtractRow
                label="Services"
                filled={session.draft.items.length > 0}
                value={
                  session.draft.items.length
                    ? session.draft.items
                        .map((item) => {
                          const name =
                            seed?.services.find(
                              (service) => service.slug === item.serviceSlug,
                            )?.name ?? item.serviceSlug;
                          return `${name}${item.quantity != null ? ` × ${item.quantity}` : ''}`;
                        })
                        .join(' · ')
                    : '—'
                }
              />
              <ExtractRow
                label="Date"
                filled={Boolean(session.draft.startDate)}
                value={session.draft.startDate ?? '—'}
              />
              <ExtractRow
                label="Location"
                filled={Boolean(session.draft.locationSlug)}
                value={location?.name ?? session.draft.locationSlug ?? '—'}
              />
              <ExtractRow
                label="Budget"
                filled={session.draft.budgetMaxMinor != null}
                value={
                  session.draft.budgetMaxMinor != null
                    ? naira.format(session.draft.budgetMaxMinor / 100)
                    : '—'
                }
              />
              <ExtractRow
                label="Mode"
                filled={Boolean(session.draft.involvement)}
                value={session.draft.involvement ?? '—'}
              />
            </dl>

            {session.gaps.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  Catalog gaps
                </p>
                <ul className="mt-2 space-y-1 text-sm font-semibold text-navy-950 dark:text-surface">
                  {session.gaps.map((gap) => (
                    <li key={gap.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      {gap.term}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-navy-950 p-5 text-surface shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold">Confirm preview</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-surface/50">
                Buyer-facing
              </span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface/5 p-3 text-xs leading-relaxed text-surface/80">
              {summarizeDraft(session.draft)}
            </pre>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-card p-5">
            <button
              type="button"
              className="flex w-full min-h-11 items-center justify-between text-left"
              onClick={() => setShowPayload((value) => !value)}
              aria-expanded={showPayload}
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Channel payload
                </span>
                <span className="mt-1 block text-sm font-extrabold text-foreground">
                  {lastOutbound.length} outbound message
                  {lastOutbound.length === 1 ? '' : 's'}
                </span>
              </span>
              <span className="text-xs font-bold text-orange-600">
                {showPayload ? 'Hide' : 'Show'}
              </span>
            </button>
            {showPayload ? (
              <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-background/80 p-3 text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(lastOutbound, null, 2)}
              </pre>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ExtractRow({
  label,
  value,
  filled,
}: {
  label: string;
  value: string;
  filled: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl px-3 py-2.5 transition',
        filled
          ? 'bg-orange-500/10'
          : 'bg-background/60',
      )}
    >
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            filled ? 'bg-orange-500' : 'bg-border',
          )}
          aria-hidden
        />
        {label}
      </dt>
      <dd className="max-w-[65%] text-right text-sm font-extrabold text-foreground">
        {value}
      </dd>
    </div>
  );
}
