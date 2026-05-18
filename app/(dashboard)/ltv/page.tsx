'use client';

import { useState } from 'react';
import { Calculator, Sparkles, ChevronDown, ChevronUp, PlusCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormValues {
  frontEndPrice: string;
  aov: string;
  grossMargin: string;
  upsellValue: string;
  subscriptionMonthly: string;
  retentionMonths: string;
}

interface LTVResult {
  ltv: number;
  cac: number;
  profit: number;
  ratio: number;
}

interface AiIdeas {
  pricing: string[];
  upsell: string[];
  bundles: string[];
  subscriptions: string[];
  retention: string[];
}

// ─── AI Mock Output ───────────────────────────────────────────────────────────
const MOCK_IDEAS: AiIdeas = {
  pricing: [
    'Introduce a "Starter / Pro / Scale" tier to anchor the mid plan',
    'Add an annual billing option with 20% savings — increases upfront cash flow',
    'Offer a premium onboarding package as a one-time add-on at checkout',
    'Create urgency with a limited-time founding member rate ($X locked forever)',
  ],
  upsell: [
    'Offer a done-for-you implementation after purchase (high-margin service)',
    'Sell a private community membership as a recurring upsell post-purchase',
    'Create a "quick-start" coaching call as an order bump ($97–$197)',
    'Bundle a resource library / templates vault at 30-day mark',
  ],
  bundles: [
    'Course + Live Coaching bundle at 30% discount vs. standalone',
    'Product + 3-month accountability group combo',
    '"Full Stack" bundle: tool + training + templates + community',
    'Gift bundle targeting buyers purchasing for someone else',
  ],
  subscriptions: [
    'Monthly maintenance / accountability subscription after the core product',
    'Content update subscription — stay current as the market evolves',
  ],
  retention: [
    'Win-back sequence at 60 days post-purchase with a soft upsell',
    'Milestone celebration email at 30/60/90 days — drives referrals',
    'Quarterly live Q&A calls — low cost, high retention value',
    'Early renewal discount sent 30 days before subscription anniversary',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcLTV(form: FormValues, cacValue: number): LTVResult {
  const aov = parseFloat(form.aov) || 0;
  const margin = (parseFloat(form.grossMargin) || 0) / 100;
  const upsell = parseFloat(form.upsellValue) || 0;
  const sub = parseFloat(form.subscriptionMonthly) || 0;
  const months = parseFloat(form.retentionMonths) || 0;

  const ltv = (aov * margin) + (upsell * margin) + (sub * margin * months);
  const profit = ltv - cacValue;
  const ratio = cacValue > 0 ? parseFloat((ltv / cacValue).toFixed(2)) : 0;

  return { ltv: parseFloat(ltv.toFixed(2)), cac: cacValue, profit: parseFloat(profit.toFixed(2)), ratio };
}

function ratioColor(ratio: number) {
  if (ratio >= 3) return { text: '#22C55E', badge: 'success' as const };
  if (ratio >= 1) return { text: '#F59E0B', badge: 'warning' as const };
  return { text: '#EF4444', badge: 'danger' as const };
}

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-[var(--color-text-muted)]">{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ title, items, defaultOpen = false }: { title: string; items: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-card-hover)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--color-text)]">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 bg-[var(--color-background)]">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-accent-light)] mt-0.5 shrink-0">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Experiment Card ──────────────────────────────────────────────────────────
function ExperimentCard({ title, description, onAdd }: { title: string; description: string; onAdd: () => void }) {
  return (
    <Card className="border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors">
      <CardContent className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-1">{title}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd} className="self-start gap-1.5">
          <PlusCircle className="w-3.5 h-3.5" />
          Add to Discovery
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LTVPage() {
  const [form, setForm] = useState<FormValues>({
    frontEndPrice: '',
    aov: '',
    grossMargin: '',
    upsellValue: '',
    subscriptionMonthly: '',
    retentionMonths: '',
  });
  const [cacInput, setCacInput] = useState('');
  const [result, setResult] = useState<LTVResult | null>(null);
  const [businessDesc, setBusinessDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<AiIdeas | null>(null);

  const handleCalc = () => {
    const cac = parseFloat(cacInput) || 50;
    setResult(calcLTV(form, cac));
  };

  const handleAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiIdeas(MOCK_IDEAS);
      setAiLoading(false);
    }, 1800);
  };

  const rColor = result ? ratioColor(result.ratio) : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">LTV Expansion Engine</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Widen the gap between LTV and CAC.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column — Inputs */}
        <div className="space-y-4">
          {/* Unit Economics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[var(--color-accent-light)]" />
                Unit Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field
                label="Front-end price ($)"
                id="frontEndPrice"
                type="number"
                placeholder="e.g. 97"
                value={form.frontEndPrice}
                onChange={(e) => setForm({ ...form, frontEndPrice: e.target.value })}
              />
              <Field
                label="Average Order Value ($)"
                id="aov"
                type="number"
                placeholder="e.g. 147"
                value={form.aov}
                onChange={(e) => setForm({ ...form, aov: e.target.value })}
              />
              <Field
                label="Gross Margin (%)"
                id="grossMargin"
                type="number"
                placeholder="e.g. 70"
                value={form.grossMargin}
                onChange={(e) => setForm({ ...form, grossMargin: e.target.value })}
              />
              <Field
                label="Current CAC ($) — for ratio calculation"
                id="cac"
                type="number"
                placeholder="e.g. 50"
                value={cacInput}
                onChange={(e) => setCacInput(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Expansion Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Expansion Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field
                label="Upsell / Cross-sell value ($)"
                id="upsellValue"
                type="number"
                placeholder="e.g. 200"
                value={form.upsellValue}
                onChange={(e) => setForm({ ...form, upsellValue: e.target.value })}
              />
              <Field
                label="Subscription monthly value ($)"
                id="subscriptionMonthly"
                type="number"
                placeholder="e.g. 29"
                value={form.subscriptionMonthly}
                onChange={(e) => setForm({ ...form, subscriptionMonthly: e.target.value })}
              />
              <Field
                label="Retention period (months)"
                id="retentionMonths"
                type="number"
                placeholder="e.g. 6"
                value={form.retentionMonths}
                onChange={(e) => setForm({ ...form, retentionMonths: e.target.value })}
              />
            </CardContent>
          </Card>

          <Button size="lg" className="w-full gap-2" onClick={handleCalc}>
            <ArrowRight className="w-4 h-4" />
            Calculate LTV
          </Button>

          {/* AI Brainstorm */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-warning)]" />
                AI Brainstorm
              </CardTitle>
              <CardDescription>Describe your business model to generate LTV ideas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="E.g. Online course for entrepreneurs who want to build automated sales systems. Main product is $997. Currently no upsell or subscription..."
                rows={4}
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleAI}
                disabled={aiLoading || !businessDesc.trim()}
              >
                {aiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                    Generating ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Output */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* LTV Hero */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 to-[#38BDF8]/5 pointer-events-none" />
                <CardContent className="p-6 text-center">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Estimated LTV</p>
                  <p className="text-6xl font-black gradient-text mb-1">${result.ltv.toLocaleString()}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">per customer, full lifecycle</p>
                </CardContent>
              </Card>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'CAC Gap',
                    value: `$${Math.abs(result.profit).toLocaleString()}`,
                    sub: result.profit >= 0 ? 'Profit per customer' : 'Loss per customer',
                    color: result.profit >= 0 ? '#22C55E' : '#EF4444',
                  },
                  {
                    label: 'Profit / Customer',
                    value: result.profit >= 0 ? `$${result.profit.toLocaleString()}` : `-$${Math.abs(result.profit)}`,
                    sub: result.profit >= 0 ? 'Positive margin' : 'Negative margin',
                    color: result.profit >= 0 ? '#22C55E' : '#EF4444',
                  },
                  {
                    label: 'LTV:CAC Ratio',
                    value: `${result.ratio}x`,
                    sub: result.ratio >= 3 ? 'Healthy — scale' : result.ratio >= 1 ? 'Borderline' : 'Below threshold',
                    color: rColor?.text,
                  },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{m.label}</p>
                      <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Ratio health badge */}
              <div className="flex items-center gap-2 px-1">
                <Badge variant={rColor?.badge}>
                  {result.ratio >= 3 ? 'Healthy ratio — ready to scale' : result.ratio >= 1 ? 'Borderline — improve LTV or reduce CAC' : 'Below threshold — fix before scaling'}
                </Badge>
              </div>
            </>
          ) : (
            <Card className="h-60 flex items-center justify-center border-dashed">
              <div className="text-center space-y-2">
                <Calculator className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
                <p className="text-sm text-[var(--color-text-muted)]">Fill in the inputs and click Calculate</p>
              </div>
            </Card>
          )}

          {/* AI Ideas Output */}
          {aiIdeas && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide px-1">AI-Generated Ideas</p>
              <AccordionSection title="Pricing Ideas" items={aiIdeas.pricing} defaultOpen />
              <AccordionSection title="Upsell Opportunities" items={aiIdeas.upsell} />
              <AccordionSection title="Bundle Ideas" items={aiIdeas.bundles} />
              <AccordionSection title="Subscription Models" items={aiIdeas.subscriptions} />
              <AccordionSection title="Retention Offers" items={aiIdeas.retention} />
            </div>
          )}
        </div>
      </div>

      {/* Suggested Experiments */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Suggested Experiments</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Run these to expand LTV before scaling spend</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExperimentCard
            title="Order Bump — Quick-Start Call"
            description="Add a $97 coaching call as an order bump on the checkout page. Low effort, tests immediate upsell appetite."
            onAdd={() => {}}
          />
          <ExperimentCard
            title="30-Day Retention Offer"
            description="Send a special offer email at day 30 with a subscription or continuation product. Tests post-purchase LTV expansion."
            onAdd={() => {}}
          />
          <ExperimentCard
            title="Annual Plan Test"
            description="Introduce an annual billing option with 20% discount. Tests price sensitivity and improves cash flow predictability."
            onAdd={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
