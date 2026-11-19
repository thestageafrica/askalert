import { Button, Card, Section } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';

export function Vendors() {
  const joinUrl = getWhatsAppUrl('Hi AskAlert, I want to join as a vendor.');

  return (
    <Section
      id="vendors"
      eyebrow="Vendors"
      title="For vendors"
      description="Reach serious buyers without paying for ads."
      className="scroll-mt-24"
    >
      <Card className="relative overflow-hidden border-orange-500/25 bg-navy-950 p-8 text-surface sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--glow-orange),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative">
          <h3 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get customers on WhatsApp. Join free.
          </h3>
          <p className="mt-4 max-w-xl text-surface/80">
            AskAlert brings matched requests to you. You reply with your offer. Buyers choose.
          </p>
          <div className="mt-8">
            <Button href={joinUrl} target="_blank" rel="noopener noreferrer" size="lg">
              Join as a vendor
            </Button>
          </div>
        </div>
      </Card>
    </Section>
  );
}
