import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PlanDefinition } from '@askalert/core';
import { Button, Section, cn } from '@askalert/ui';
import {
  chatExplainer,
  marketingBuyerPlans,
  marketingVendorPlan,
  planFeatureLines,
  planPriceLabel,
} from '../../lib/plan-marketing';
import { getWhatsAppUrl } from '../../lib/site';

export function Plans() {
  const buyers = marketingBuyerPlans();
  const vendor = marketingVendorPlan();
  const starterUrl = getWhatsAppUrl('Hi AskAlert, I want Starter.');
  const vendorUrl = getWhatsAppUrl('Hi AskAlert, I want to join as a vendor.');

  return (
    <Section
      id="plans"
      eyebrow="Plans"
      title="Simple plans. Clear limits."
      description="Prices come from our live plan list. No token talk — just what you can do each month."
      className="scroll-mt-24"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {buyers.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            featured={plan.slug === 'buyer_starter'}
            cta={
              plan.slug === 'buyer_starter' ? (
                <Button href={starterUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                  Get Starter
                </Button>
              ) : (
                <Button href="/app" variant="secondary" className="w-full">
                  Start free
                </Button>
              )
            }
            className={cn('plans-rise', index === 1 && 'plans-rise-delay-1', index === 2 && 'plans-rise-delay-2')}
          />
        ))}
        {vendor ? (
          <PlanCard
            plan={vendor}
            eyebrow="For vendors"
            note="Lead alerts first. If you are near your limit, we send a digest instead of dropping you."
            cta={
              <Button href={vendorUrl} target="_blank" rel="noopener noreferrer" variant="secondary" className="w-full">
                Join free as a vendor
              </Button>
            }
            className="plans-rise plans-rise-delay-2 lg:col-span-1"
          />
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ExplainerCard title={chatExplainer.inApp.title} body={chatExplainer.inApp.body} />
        <ExplainerCard title={chatExplainer.whatsapp.title} body={chatExplainer.whatsapp.body} />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Want the full breakdown?{' '}
        <Link
          href="/plans"
          className="font-bold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400"
        >
          See all plans and FAQ
        </Link>
      </p>
    </Section>
  );
}

function PlanCard({
  plan,
  featured = false,
  eyebrow,
  note,
  cta,
  className,
}: {
  plan: PlanDefinition;
  featured?: boolean;
  eyebrow?: string;
  note?: string;
  cta: ReactNode;
  className?: string;
}) {
  const lines = planFeatureLines(plan);

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 shadow-sm transition duration-300',
        featured
          ? 'border-orange-400/40 bg-navy-950 text-surface shadow-[0_20px_50px_var(--glow-orange)]'
          : 'border-border/80 bg-card text-foreground hover:border-orange-500/35 hover:shadow-md',
        className,
      )}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,_var(--glow-orange-strong),_transparent_55%)]"
          aria-hidden
        />
      ) : null}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            {eyebrow || featured ? (
              <p
                className={cn(
                  'text-xs font-bold uppercase tracking-[0.16em]',
                  featured ? 'text-orange-400' : 'text-orange-700 dark:text-orange-400',
                )}
              >
                {eyebrow ?? 'Most popular'}
              </p>
            ) : (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                For buyers
              </p>
            )}
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{plan.name}</h3>
          </div>
          {featured ? (
            <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-300">
              Recommended
            </span>
          ) : null}
        </div>

        <p className={cn('mt-4 text-3xl font-extrabold tracking-tight', featured ? 'text-orange-400' : 'text-foreground')}>
          {planPriceLabel(plan)}
        </p>
        <p className={cn('mt-2 text-sm leading-relaxed', featured ? 'text-surface/75' : 'text-muted-foreground')}>
          {plan.features.summary}
        </p>

        <ul className={cn('mt-5 space-y-2.5 text-sm', featured ? 'text-surface/85' : 'text-muted-foreground')}>
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span
                className={cn(
                  'mt-1.5 size-1.5 shrink-0 rounded-full',
                  featured ? 'bg-orange-400' : 'bg-orange-500',
                )}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {note ? (
          <p
            className={cn(
              'mt-4 rounded-2xl border px-3 py-2 text-xs leading-relaxed',
              featured
                ? 'border-surface/15 bg-surface/5 text-surface/75'
                : 'border-border/70 bg-surface-subtle text-muted-foreground',
            )}
          >
            {note}
          </p>
        ) : null}

        <div className="mt-auto pt-6">{cta}</div>
      </div>
    </article>
  );
}

function ExplainerCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-gradient-to-br from-card to-surface-subtle p-5 shadow-sm dark:from-navy-900 dark:to-navy-950">
      <h3 className="text-base font-extrabold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
