'use client';

import { useState } from 'react';
import { Check, Sparkles, Zap, Rocket, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'free' | 'plus' | 'pro';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  monthlyPrice: number;
  yearlyPrice: number;
  highlight: boolean;
  badge?: string;
  features: PlanFeature[];
  cta: string;
  ctaVariant: 'ghost' | 'outline' | 'default';
}

// ─── Plans Data ───────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try the engine, see what it can do.',
    icon: Sparkles,
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlight: false,
    features: [
      { text: '1 business profile', included: true },
      { text: 'Creative Map (5 avatars, 5 angles)', included: true },
      { text: 'AI creative generation (10/month)', included: true },
      { text: 'Media Library (up to 50 files)', included: true },
      { text: 'Basic dashboard', included: true },
      { text: 'Winners detection', included: false },
      { text: 'LTV Engine', included: false },
      { text: 'Scale Readiness Score', included: false },
      { text: 'Meta campaign upload', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline',
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'For founders actively testing and scaling creative.',
    icon: Zap,
    monthlyPrice: 79,
    yearlyPrice: 59,
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: '3 business profiles', included: true },
      { text: 'Creative Map (10 avatars, 10 angles)', included: true },
      { text: 'AI creative generation (unlimited)', included: true },
      { text: 'Media Library (unlimited)', included: true },
      { text: 'Full dashboard + Winners detection', included: true },
      { text: 'LTV Engine', included: true },
      { text: 'Scale Readiness Score', included: true },
      { text: 'Meta campaign upload', included: true },
      { text: 'Email support', included: true },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Plus',
    ctaVariant: 'default',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For agencies and teams managing multiple brands.',
    icon: Rocket,
    monthlyPrice: 199,
    yearlyPrice: 149,
    highlight: false,
    features: [
      { text: '10 business profiles', included: true },
      { text: 'Creative Map (unlimited)', included: true },
      { text: 'AI creative generation (unlimited)', included: true },
      { text: 'Media Library (unlimited)', included: true },
      { text: 'Full dashboard + Winners detection', included: true },
      { text: 'LTV Engine', included: true },
      { text: 'Scale Readiness Score', included: true },
      { text: 'Meta campaign upload', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom onboarding + team access', included: true },
    ],
    cta: 'Start Pro',
    ctaVariant: 'outline',
  },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const Icon = plan.icon;
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.monthlyPrice > 0
    ? Math.round(((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 transition-all duration-200',
        plan.highlight
          ? 'border-[var(--color-accent)]/50 bg-gradient-to-b from-[var(--color-accent)]/5 to-[var(--color-card)] shadow-xl shadow-[var(--color-accent)]/10'
          : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/30'
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-accent)]/30">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            plan.highlight
              ? 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] shadow-lg shadow-[var(--color-accent)]/30'
              : 'bg-[var(--color-background)] border border-[var(--color-border)]'
          )}
        >
          <Icon className={cn('h-4 w-4', plan.highlight ? 'text-white' : 'text-[var(--color-text-muted)]')} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--color-text)]">{plan.name}</h3>
        </div>
      </div>

      {/* Price */}
      <div className="mb-2">
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-black text-[var(--color-text)]">
            {price === 0 ? 'Free' : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-sm text-[var(--color-text-muted)] mb-1.5">
              / month
            </span>
          )}
        </div>
        {yearly && savings > 0 && (
          <p className="text-xs text-[#22C55E] mt-1 font-medium">
            Save {savings}% vs monthly — billed annually
          </p>
        )}
        {!yearly && plan.yearlyPrice > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            ${plan.yearlyPrice}/mo billed yearly
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--color-text-muted)] mb-5 leading-relaxed">
        {plan.description}
      </p>

      {/* CTA Button */}
      <Button
        className={cn(
          'w-full mb-6 gap-2',
          plan.highlight
            ? 'gradient-accent border-0 shadow-lg shadow-[var(--color-accent)]/25 hover:brightness-110'
            : ''
        )}
        variant={plan.highlight ? 'default' : plan.ctaVariant}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Button>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)] mb-5" />

      {/* Features */}
      <ul className="flex flex-col gap-3 flex-1">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-2.5">
            <div
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full mt-0.5',
                feature.included
                  ? plan.highlight
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]'
                    : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                  : 'opacity-30'
              )}
            >
              {feature.included && (
                <Check className="h-2.5 w-2.5" />
              )}
              {!feature.included && (
                <span className="w-1.5 h-px bg-current rounded-full" />
              )}
            </div>
            <span
              className={cn(
                'text-xs leading-relaxed',
                feature.included
                  ? 'text-[var(--color-text-secondary)]'
                  : 'text-[var(--color-text-muted)] line-through opacity-50'
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 pb-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 text-[11px] font-semibold text-[var(--color-accent-light)] mb-4">
          <Sparkles className="h-3 w-3" />
          Simple pricing, no surprises
        </div>
        <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">
          Pick your{' '}
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            growth plan
          </span>
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-3 max-w-lg mx-auto leading-relaxed">
          From testing your first avatar to scaling 10 brands — CLS Engine grows with you.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={cn('text-sm font-medium', !yearly ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]')}>
            Monthly
          </span>
          <Switch
            checked={yearly}
            onCheckedChange={setYearly}
          />
          <span className={cn('text-sm font-medium flex items-center gap-2', yearly ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]')}>
            Yearly
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20">
              Save up to 25%
            </span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} yearly={yearly} />
        ))}
      </div>

      {/* FAQ / Guarantee */}
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          All plans include a{' '}
          <span className="font-semibold text-[var(--color-text)]">14-day free trial</span>.
          No credit card required to start. Cancel anytime.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Payments handled securely. Need a custom plan?{' '}
          <a href="mailto:itay@binder.co.il" className="text-[var(--color-accent-light)] hover:underline">
            Get in touch
          </a>
        </p>
      </div>
    </div>
  );
}
