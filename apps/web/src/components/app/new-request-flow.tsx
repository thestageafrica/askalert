'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildIntakeSteps, findSeedCategoryBySlug } from '@askalert/category-engine';
import { Button, Input, cn } from '@askalert/ui';
import { involvementOptions } from '../../lib/app/involvement';
import { useMockStore } from '../../lib/app/mock-store';
import type { InvolvementMode } from '../../lib/app/types';
import { AppHeader } from './app-header';

export function NewRequestFlow({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const { createRequest } = useMockStore();
  const category = findSeedCategoryBySlug(categorySlug);
  const steps = useMemo(
    () => (category ? buildIntakeSteps(category, 'need') : []),
    [category],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [involvement, setInvolvement] = useState<InvolvementMode>('assist');
  const [phase, setPhase] = useState<'questions' | 'involvement' | 'summary'>('questions');

  if (!category || (category.status !== 'pilot' && category.status !== 'live')) {
    return (
      <div className="p-4">
        <AppHeader title="Category unavailable" subtitle="This category is not live yet." />
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Pick a live category from Home, or tap Notify me on coming-soon tiles.
          </p>
          <Button href="/app" className="mt-4">
            Back home
          </Button>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const progress =
    phase === 'questions'
      ? ((index + 1) / (steps.length + 2)) * 100
      : phase === 'involvement'
        ? ((steps.length + 1) / (steps.length + 2)) * 100
        : 100;

  const currentValue = step ? answers[step.key] : undefined;

  const onNextQuestion = () => {
    if (!step) {
      return;
    }
    const message = step.validate(currentValue);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (index >= steps.length - 1) {
      setPhase('involvement');
      return;
    }
    setIndex((value) => value + 1);
  };

  const onSubmit = () => {
    const title =
      category.slug === 'shortlets'
        ? `${String(answers.bedrooms ?? '')}-bedroom shortlet · ${String(answers.area ?? 'Lagos')}`
        : category.slug === 'events'
          ? `${String(answers.event_type ?? 'Event')} · ${String(answers.venue_area ?? 'Lagos')}`
          : `${category.name} · ${String(answers.area ?? 'Lagos')}`;

    const request = createRequest({
      categorySlug: category.slug,
      categoryName: category.name,
      title,
      involvement,
      answers,
    });
    router.push(`/app/request/${request.id}`);
  };

  return (
    <div>
      <AppHeader
        title={`New ${category.name.toLowerCase()} ask`}
        subtitle="One clear question at a time."
      />
      <div className="space-y-5 px-4 pt-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Ask progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {phase === 'questions' && step ? (
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              Question {index + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">{step.label}</h2>

            <div className="mt-5">
              {step.type === 'select' ? (
                <div className="grid gap-2">
                  {(step.options ?? []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        'min-h-11 rounded-2xl border px-4 text-left text-sm font-semibold',
                        currentValue === option
                          ? 'border-orange-500 bg-orange-500/10 text-foreground'
                          : 'border-border bg-card-muted text-muted-foreground',
                      )}
                      onClick={() => {
                        setAnswers((current) => ({ ...current, [step.key]: option }));
                        setError(null);
                      }}
                    >
                      {option.replaceAll('_', ' ')}
                    </button>
                  ))}
                </div>
              ) : step.type === 'boolean' ? (
                <div className="grid grid-cols-2 gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      className={cn(
                        'min-h-11 rounded-2xl border text-sm font-semibold',
                        currentValue === value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border bg-card-muted',
                      )}
                      onClick={() => {
                        setAnswers((current) => ({ ...current, [step.key]: value }));
                        setError(null);
                      }}
                    >
                      {value ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  label={undefined}
                  type={
                    step.type === 'number' || step.type === 'money'
                      ? 'number'
                      : step.type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  value={
                    currentValue === undefined || currentValue === null
                      ? ''
                      : String(currentValue)
                  }
                  onChange={(event) => {
                    const raw = event.target.value;
                    const next =
                      step.type === 'number' || step.type === 'money'
                        ? raw === ''
                          ? ''
                          : Number(raw)
                        : raw;
                    setAnswers((current) => ({ ...current, [step.key]: next }));
                    setError(null);
                  }}
                  hint={step.unit ? `Unit: ${step.unit}` : undefined}
                  error={error ?? undefined}
                />
              )}
              {error && step.type === 'select' ? (
                <p className="mt-2 text-sm text-danger">{error}</p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                disabled={index === 0}
                onClick={() => {
                  setError(null);
                  setIndex((value) => Math.max(0, value - 1));
                }}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={onNextQuestion}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'involvement' ? (
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-xl font-extrabold tracking-tight">
              How involved should AskAlert be?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how much of the chase you want us to handle.
            </p>
            <div className="mt-5 space-y-2">
              {involvementOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left',
                    involvement === option.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border bg-card-muted',
                  )}
                  onClick={() => setInvolvement(option.id)}
                >
                  <p className="text-sm font-extrabold text-foreground">
                    {option.title}{' '}
                    <span className="font-semibold text-orange-600">({option.label})</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.blurb}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setPhase('questions');
                  setIndex(steps.length - 1);
                }}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => setPhase('summary')}>
                Review
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'summary' ? (
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-xl font-extrabold tracking-tight">Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check this once. Then AskAlert starts asking vendors.
            </p>
            <dl className="mt-5 space-y-3">
              {steps.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {formatAnswer(answers[item.key])}
                  </dd>
                </div>
              ))}
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3 text-sm">
                <dt className="text-muted-foreground">AskAlert role</dt>
                <dd className="text-right font-semibold text-foreground">
                  {involvementOptions.find((option) => option.id === involvement)?.label}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setPhase('involvement')}>
                Back
              </Button>
              <Button className="flex-1" onClick={onSubmit}>
                Send ask
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value).replaceAll('_', ' ');
}
