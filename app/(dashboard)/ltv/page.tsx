'use client';

import { useState, useEffect } from 'react';
import { Calculator, ChevronDown, ChevronUp, PlusCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateWorkspace } from '@/lib/workspace';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormValues {
  frontEndPrice: string;
  upsellValue: string;
  subscriptionMonthly: string;
  retentionMonths: string;
  grossMargin: string;
  cac: string;
}

interface LTVResult {
  estimated_ltv: number;
  ltv_gap: number;
  profit_per_customer: number;
  ltv_cac_ratio: number;
}

interface Insight {
  title: string;
  body: string;
}

// ─── Calculation ──────────────────────────────────────────────────────────────
function calcLTV(form: FormValues): LTVResult {
  const frontEnd = parseFloat(form.frontEndPrice) || 0;
  const upsell = parseFloat(form.upsellValue) || 0;
  const sub = parseFloat(form.subscriptionMonthly) || 0;
  const months = parseFloat(form.retentionMonths) || 0;
  const margin = parseFloat(form.grossMargin) || 0;
  const cac = parseFloat(form.cac) || 0;

  const estimated_ltv = frontEnd + upsell + sub * months;
  const ltv_gap = estimated_ltv - cac;
  const profit_per_customer = (estimated_ltv * margin) / 100 - cac;
  const ltv_cac_ratio = cac > 0 ? parseFloat((estimated_ltv / cac).toFixed(2)) : 0;

  return {
    estimated_ltv: parseFloat(estimated_ltv.toFixed(2)),
    ltv_gap: parseFloat(ltv_gap.toFixed(2)),
    profit_per_customer: parseFloat(profit_per_customer.toFixed(2)),
    ltv_cac_ratio,
  };
}

function generateInsights(form: FormValues, result: LTVResult): Insight[] {
  const insights: Insight[] = [];
  const frontEnd = parseFloat(form.frontEndPrice) || 0;
  const sub = parseFloat(form.subscriptionMonthly) || 0;
  const months = parseFloat(form.retentionMonths) || 0;
  const cac = parseFloat(form.cac) || 0;
  const margin = parseFloat(form.grossMargin) || 0;

  // Insight 1 — LTV:CAC ratio
  if (result.ltv_cac_ratio < 1) {
    insights.push({
      title: 'Unit Economics Alert',
      body: `Your LTV:CAC is ${result.ltv_cac_ratio}x — you're losing money on every customer. Before scaling, reduce CAC or increase front-end price. Even a 20% price increase to $${(frontEnd * 1.2).toFixed(0)} would make a meaningful difference.`,
    });
  } else if (result.ltv_cac_ratio < 2) {
    insights.push({
      title: 'Pricing Lever',
      body: `At ${result.ltv_cac_ratio}x LTV:CAC, margin is tight. Consider adding a payment plan to increase conversions or test a $${(frontEnd * 1.25).toFixed(0)} price point. A subscription at $${sub > 0 ? (sub * 1.2).toFixed(0) : (frontEnd * 0.1).toFixed(0)}/month extended by just 2 more months adds $${(2 * (sub > 0 ? sub : frontEnd * 0.1)).toFixed(0)} to LTV.`,
    });
  } else if (result.ltv_cac_ratio >= 3) {
    insights.push({
      title: 'Strong Unit Economics — Scale Focus',
      body: `You have a ${result.ltv_cac_ratio}x LTV:CAC ratio — your numbers support aggressive scaling. Focus on volume: expand winning creatives, increase daily budgets 20-30% per week, and systematize your acquisition process.`,
    });
  }

  // Insight 2 — Subscription / Retention
  if (sub === 0) {
    const suggestedSub = Math.round(frontEnd * 0.1);
    insights.push({
      title: 'Add a Recurring Revenue Stream',
      body: `You have no subscription component. Adding a $${suggestedSub}/month continuity offer and retaining customers for just 4 months adds $${(suggestedSub * 4).toFixed(0)} to every customer's LTV — a ${frontEnd > 0 ? ((suggestedSub * 4 / frontEnd) * 100).toFixed(0) : '—'}% increase with no extra acquisition cost.`,
    });
  } else if (months < 6) {
    insights.push({
      title: 'Improve Retention',
      body: `Your current retention is ${months} months. Extending it to ${months + 2} months through a win-back sequence or quarterly check-in adds $${(sub * 2).toFixed(0)} per customer to LTV — with zero CAC increase.`,
    });
  }

  // Insight 3 — Upsell gap
  const upsell = parseFloat(form.upsellValue) || 0;
  if (upsell === 0) {
    const suggestedUpsell = Math.round(frontEnd * 1.5);
    insights.push({
      title: 'Missing Upsell Opportunity',
      body: `No upsell in your funnel. A done-for-you implementation or private community at $${suggestedUpsell} would add $${(suggestedUpsell * (margin / 100 || 0.7)).toFixed(0)} gross profit per customer. Even a 20% upsell take-rate is high-margin revenue.`,
    });
  } else {
    insights.push({
      title: 'Profit Potential',
      body: `At ${margin}% margin, your profit per customer is $${result.profit_per_customer.toFixed(0)}. If you acquire ${Math.round(cac > 0 ? 5000 / cac : 100)} customers at current CAC, you net $${(result.profit_per_customer * Math.round(cac > 0 ? 5000 / cac : 100)).toLocaleString()}. Every LTV dollar added compounds directly to bottom line.`,
    });
  }

  return insights;
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

// ─── Experiment Card ──────────────────────────────────────────────────────────
function ExperimentCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors">
      <CardContent className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-1">{title}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
        <Button size="sm" variant="outline" className="self-start gap-1.5">
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
    upsellValue: '',
    subscriptionMonthly: '',
    retentionMonths: '',
    grossMargin: '',
    cac: '',
  });
  const [result, setResult] = useState<LTVResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const workspaceId = await getOrCreateWorkspace(supabase, user.id);

        const { data, error } = await supabase
          .from('ltv_models')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setForm({
            frontEndPrice: String(data.front_end_price ?? ''),
            upsellValue: String(data.upsell_value ?? ''),
            subscriptionMonthly: String(data.subscription_monthly ?? ''),
            retentionMonths: String(data.retention_months ?? ''),
            grossMargin: String(data.gross_margin ?? ''),
            cac: String(data.cac ?? ''),
          });
        }
      } catch {
        // Silently fail — user just starts with empty form
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Calculate & Save ──────────────────────────────────────────────────────
  const handleCalc = async () => {
    const computed = calcLTV(form);
    setResult(computed);
    setInsights(generateInsights(form, computed));
    setSaveError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workspaceId = await getOrCreateWorkspace(supabase, user.id);

      const { error } = await supabase
        .from('ltv_models')
        .upsert({
          workspace_id: workspaceId,
          front_end_price: parseFloat(form.frontEndPrice) || null,
          upsell_value: parseFloat(form.upsellValue) || null,
          subscription_monthly: parseFloat(form.subscriptionMonthly) || null,
          retention_months: parseFloat(form.retentionMonths) || null,
          gross_margin: parseFloat(form.grossMargin) || null,
          cac: parseFloat(form.cac) || null,
          estimated_ltv: computed.estimated_ltv,
          ltv_cac_ratio: computed.ltv_cac_ratio,
        }, { onConflict: 'workspace_id' });

      if (error) setSaveError('Could not save — ' + error.message);
    } catch (err) {
      setSaveError('Save failed. Changes will not persist.');
    }
  };

  const rColor = result ? ratioColor(result.ltv_cac_ratio) : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">LTV Expansion Engine</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Widen the gap between LTV and CAC.</p>
      </div>

      {saveError && (
        <div className="px-4 py-2 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-xs text-[#F59E0B]">
          {saveError}
        </div>
      )}

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
                label="Gross Margin (%)"
                id="grossMargin"
                type="number"
                placeholder="e.g. 70"
                value={form.grossMargin}
                onChange={(e) => setForm({ ...form, grossMargin: e.target.value })}
              />
              <Field
                label="Current CAC ($)"
                id="cac"
                type="number"
                placeholder="e.g. 50"
                value={form.cac}
                onChange={(e) => setForm({ ...form, cac: e.target.value })}
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

          <Button size="lg" className="w-full gap-2" onClick={handleCalc} disabled={loading}>
            <ArrowRight className="w-4 h-4" />
            {loading ? 'Loading...' : 'Calculate LTV'}
          </Button>
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
                  <p className="text-6xl font-black gradient-text mb-1">${result.estimated_ltv.toLocaleString()}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">per customer, full lifecycle</p>
                </CardContent>
              </Card>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'LTV Gap',
                    value: result.ltv_gap >= 0 ? `$${result.ltv_gap.toLocaleString()}` : `-$${Math.abs(result.ltv_gap).toLocaleString()}`,
                    sub: result.ltv_gap >= 0 ? 'LTV above CAC' : 'LTV below CAC',
                    color: result.ltv_gap >= 0 ? '#22C55E' : '#EF4444',
                  },
                  {
                    label: 'Profit / Customer',
                    value: result.profit_per_customer >= 0
                      ? `$${result.profit_per_customer.toLocaleString()}`
                      : `-$${Math.abs(result.profit_per_customer).toLocaleString()}`,
                    sub: result.profit_per_customer >= 0 ? 'Positive margin' : 'Negative margin',
                    color: result.profit_per_customer >= 0 ? '#22C55E' : '#EF4444',
                  },
                  {
                    label: 'LTV:CAC Ratio',
                    value: `${result.ltv_cac_ratio}x`,
                    sub: result.ltv_cac_ratio >= 3 ? 'Healthy — scale' : result.ltv_cac_ratio >= 1 ? 'Borderline' : 'Below threshold',
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
                  {result.ltv_cac_ratio >= 3
                    ? 'Healthy ratio — ready to scale'
                    : result.ltv_cac_ratio >= 1
                    ? 'Borderline — improve LTV or reduce CAC'
                    : 'Below threshold — fix before scaling'}
                </Badge>
              </div>

              {/* Data-driven Insights */}
              {insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide px-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                    Insights Based on Your Numbers
                  </p>
                  {insights.map((insight, i) => (
                    <Card key={i} className="border-[var(--color-border)]">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-[var(--color-text)] mb-1">{insight.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{insight.body}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="h-60 flex items-center justify-center border-dashed">
              <div className="text-center space-y-2">
                <Calculator className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
                <p className="text-sm text-[var(--color-text-muted)]">Fill in the inputs and click Calculate</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Suggested Experiments — reference real numbers when available */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Suggested Experiments</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Run these to expand LTV before scaling spend</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExperimentCard
            title="Order Bump — Quick-Start Call"
            description={
              result
                ? `Add a $${Math.round((parseFloat(form.frontEndPrice) || 97) * 0.15 + 47)} coaching call as an order bump at checkout. At your current LTV:CAC of ${result.ltv_cac_ratio}x, even a 15% take-rate meaningfully improves ratio.`
                : 'Add a coaching call as an order bump on the checkout page. Low effort, tests immediate upsell appetite.'
            }
          />
          <ExperimentCard
            title="30-Day Retention Offer"
            description={
              result && parseFloat(form.subscriptionMonthly) > 0
                ? `Send an offer at day 30 targeting a ${parseFloat(form.retentionMonths) + 2}-month extension. That's +$${(parseFloat(form.subscriptionMonthly) * 2).toFixed(0)} to LTV at zero CAC.`
                : 'Send a special offer email at day 30 with a subscription or continuation product. Tests post-purchase LTV expansion.'
            }
          />
          <ExperimentCard
            title="Annual Plan Test"
            description={
              result && parseFloat(form.subscriptionMonthly) > 0
                ? `Offer annual billing at $${Math.round(parseFloat(form.subscriptionMonthly) * 10)}/year (2 months free). Locks in ${(parseFloat(form.retentionMonths) || 6) > 10 ? 'extended' : 'more predictable'} cash flow and improves retention.`
                : 'Introduce an annual billing option with a discount. Tests price sensitivity and improves cash flow predictability.'
            }
          />
        </div>
      </div>
    </div>
  );
}
