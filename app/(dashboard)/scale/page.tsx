'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Circle, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateWorkspace } from '@/lib/workspace';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReadinessStatus = 'Not Ready' | 'Needs More Testing' | 'Winner Detected' | 'Ready to Scale';

interface Metrics {
  winners: string;
  avg_cac: string;
  avg_ltv: string;
  roas: string;
  conversionConsistency: number;
  spendStability: number;
}

interface ScoreResult {
  score: number;
  status: ReadinessStatus;
}

// ─── Scoring Logic (updated per spec) ────────────────────────────────────────
function calcScore(m: Metrics): ScoreResult {
  let score = 0;

  const winners = parseInt(m.winners) || 0;
  const cac = parseFloat(m.avg_cac) || 0;
  const ltv = parseFloat(m.avg_ltv) || 0;
  const roas = parseFloat(m.roas) || 0;
  const conv = m.conversionConsistency;
  const spend = m.spendStability;

  // Winners (0-25 pts)
  if (winners >= 3) score += 25;

  // LTV / CAC (0-25 pts)
  if (cac > 0 && ltv > 0) {
    const ratio = ltv / cac;
    if (ratio >= 3) score += 25;
    else if (ratio >= 1.5) score += 12;
  }

  // ROAS (0-20 pts)
  if (roas >= 2.5) score += 20;
  else if (roas >= 1.5) score += 10;

  // Spend stability (0-15 pts)
  if (spend >= 70) score += 15;
  else if (spend >= 50) score += 7;

  // Conversion consistency (0-15 pts)
  if (conv >= 70) score += 15;
  else if (conv >= 50) score += 7;

  score = Math.min(100, Math.max(0, score));

  let status: ReadinessStatus;
  if (score >= 80) status = 'Ready to Scale';
  else if (score >= 55) status = 'Winner Detected';
  else if (score >= 30) status = 'Needs More Testing';
  else status = 'Not Ready';

  return { score, status };
}

const STATUS_CONFIG: Record<ReadinessStatus, { color: string; bg: string; textColor: string; icon: React.ElementType }> = {
  'Not Ready': { color: '#EF4444', bg: '#ef444415', textColor: 'text-[#EF4444]', icon: AlertTriangle },
  'Needs More Testing': { color: '#F59E0B', bg: '#f59e0b15', textColor: 'text-[#F59E0B]', icon: RefreshCw },
  'Winner Detected': { color: '#38BDF8', bg: '#38bdf815', textColor: 'text-[#38BDF8]', icon: TrendingUp },
  'Ready to Scale': { color: '#22C55E', bg: '#22c55e15', textColor: 'text-[#22C55E]', icon: Zap },
};

const RECOMMENDATIONS: Record<ReadinessStatus, string> = {
  'Not Ready': 'Focus on generating more hypotheses in the Discovery Engine. You need more signal before spending money on scale.',
  'Needs More Testing': 'You have signals. Run 3 more experiments before scaling. Tighten your conversion consistency first.',
  'Winner Detected': 'Strong signal detected. Prepare your ops for scale — fulfillment, customer support, cash flow.',
  'Ready to Scale': "You're ready. Scale with confidence. Monitor your ROAS daily and expand budgets by 20-30% per week.",
};

const CHECKLIST_ITEMS = [
  { key: 'winners', label: 'Minimum 3 winners detected', check: (m: Metrics) => parseInt(m.winners) >= 3 },
  {
    key: 'cac', label: 'LTV:CAC ≥ 3x', check: (m: Metrics) => {
      const cac = parseFloat(m.avg_cac);
      const ltv = parseFloat(m.avg_ltv);
      return cac > 0 && ltv > 0 && ltv / cac >= 3;
    }
  },
  { key: 'roas', label: 'ROAS ≥ 2.5x consistently', check: (m: Metrics) => parseFloat(m.roas) >= 2.5 },
  { key: 'spend', label: 'Spend stability ≥ 70%', check: (m: Metrics) => m.spendStability >= 70 },
  { key: 'conv', label: 'Conversion consistency ≥ 70%', check: (m: Metrics) => m.conversionConsistency >= 70 },
];

// ─── Gauge Display ────────────────────────────────────────────────────────────
function ScoreGauge({ score, status }: { score: number; status: ReadinessStatus }) {
  const cfg = STATUS_CONFIG[status];
  const data = [{ value: score, fill: cfg.color }];

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-64 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="90%"
            data={data}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#1e2d45' }}
              dataKey="value"
              cornerRadius={8}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black" style={{ color: cfg.color }}>{score}</span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1">/ 100</span>
        </div>
      </div>

      <div
        className="mt-2 px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <cfg.icon className="w-4 h-4" />
        {status}
      </div>
    </div>
  );
}

// ─── Input Card ───────────────────────────────────────────────────────────────
function MetricInput({
  label, id, prefix, suffix, type = 'number', placeholder, value, onChange,
}: {
  label: string; id: string; prefix?: string; suffix?: string;
  type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-[var(--color-text-muted)]">{label}</Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-[var(--color-text-muted)]">{prefix}</span>}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(prefix && 'pl-7', suffix && 'pr-7')}
        />
        {suffix && <span className="absolute right-3 text-sm text-[var(--color-text-muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScalePage() {
  const [metrics, setMetrics] = useState<Metrics>({
    winners: '',
    avg_cac: '',
    avg_ltv: '',
    roas: '',
    conversionConsistency: 40,
    spendStability: 30,
  });

  const [result, setResult] = useState<ScoreResult>({ score: 0, status: 'Not Ready' });
  const [calculated, setCalculated] = useState(false);
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

        // Try loading existing scale score
        const { data: scaleData } = await supabase
          .from('scale_scores')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Also try auto-populate from latest LTV model
        const { data: ltvData } = await supabase
          .from('ltv_models')
          .select('estimated_ltv, cac')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setMetrics((prev) => ({
          ...prev,
          // Scale score fields take priority; fallback to LTV data for cac/ltv
          winners: scaleData?.winners_count != null ? String(scaleData.winners_count) : prev.winners,
          avg_cac: scaleData?.avg_cac != null
            ? String(scaleData.avg_cac)
            : ltvData?.cac != null ? String(ltvData.cac) : prev.avg_cac,
          avg_ltv: scaleData?.avg_ltv != null
            ? String(scaleData.avg_ltv)
            : ltvData?.estimated_ltv != null ? String(ltvData.estimated_ltv) : prev.avg_ltv,
          roas: scaleData?.roas != null ? String(scaleData.roas) : prev.roas,
          conversionConsistency: scaleData?.conversion_consistency ?? prev.conversionConsistency,
          spendStability: scaleData?.spend_stability ?? prev.spendStability,
        }));
      } catch {
        // Silently fail — user starts with empty form
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Calculate & Save ──────────────────────────────────────────────────────
  const handleCalc = useCallback(async () => {
    const computed = calcScore(metrics);
    setResult(computed);
    setCalculated(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workspaceId = await getOrCreateWorkspace(supabase, user.id);

      const { error } = await supabase
        .from('scale_scores')
        .upsert({
          workspace_id: workspaceId,
          winners_count: parseInt(metrics.winners) || null,
          avg_cac: parseFloat(metrics.avg_cac) || null,
          avg_ltv: parseFloat(metrics.avg_ltv) || null,
          roas: parseFloat(metrics.roas) || null,
          conversion_consistency: metrics.conversionConsistency,
          spend_stability: metrics.spendStability,
          score: computed.score,
          status: computed.status,
        }, { onConflict: 'workspace_id' });

      if (error) setSaveError('Could not save — ' + error.message);
    } catch {
      setSaveError('Save failed. Changes will not persist.');
    }
  }, [metrics]);

  const updateMetric = useCallback((key: keyof Metrics, value: string | number) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  }, []);

  const checklist = CHECKLIST_ITEMS.map((item) => ({
    ...item,
    passed: calculated ? item.check(metrics) : false,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Scale Readiness</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Scale starts with pattern detection.</p>
      </div>

      {saveError && (
        <div className="px-4 py-2 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-xs text-[#F59E0B]">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Gauge */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-6">
              <ScoreGauge score={result.score} status={result.status} />

              {/* Input Grid */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricInput
                  label="Winners Found"
                  id="winners"
                  placeholder="e.g. 3"
                  value={metrics.winners}
                  onChange={(v) => updateMetric('winners', v)}
                />
                <MetricInput
                  label="Average CAC"
                  id="avg_cac"
                  prefix="$"
                  placeholder="e.g. 45"
                  value={metrics.avg_cac}
                  onChange={(v) => updateMetric('avg_cac', v)}
                />
                <MetricInput
                  label="Average LTV"
                  id="avg_ltv"
                  prefix="$"
                  placeholder="e.g. 240"
                  value={metrics.avg_ltv}
                  onChange={(v) => updateMetric('avg_ltv', v)}
                />
                <MetricInput
                  label="Average ROAS"
                  id="roas"
                  suffix="x"
                  placeholder="e.g. 3.2"
                  value={metrics.roas}
                  onChange={(v) => updateMetric('roas', v)}
                />

                {/* Sliders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-[var(--color-text-muted)]">Conversion Consistency</Label>
                    <span className="text-xs font-medium text-[var(--color-text)]">{metrics.conversionConsistency}%</span>
                  </div>
                  <Slider
                    value={metrics.conversionConsistency}
                    onChange={(v) => updateMetric('conversionConsistency', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-[var(--color-text-muted)]">Spend Stability</Label>
                    <span className="text-xs font-medium text-[var(--color-text)]">{metrics.spendStability}%</span>
                  </div>
                  <Slider
                    value={metrics.spendStability}
                    onChange={(v) => updateMetric('spendStability', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>

              <Button size="lg" className="w-full gap-2" onClick={handleCalc} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
                {loading ? 'Loading...' : 'Recalculate'}
              </Button>
            </CardContent>
          </Card>

          {/* Recommendation */}
          {calculated && (
            <Card className="border-l-4" style={{ borderLeftColor: STATUS_CONFIG[result.status].color }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: STATUS_CONFIG[result.status].bg }}
                  >
                    {(() => {
                      const Icon = STATUS_CONFIG[result.status].icon;
                      return <Icon className="w-4 h-4" style={{ color: STATUS_CONFIG[result.status].color }} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)] mb-1">Recommendation</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{RECOMMENDATIONS[result.status]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — Checklist */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle>What you need to scale</CardTitle>
              <CardDescription>All 5 criteria must pass for full readiness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  )}
                  <p className={cn(
                    'text-sm',
                    item.passed ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                  )}>
                    {item.label}
                  </p>
                </div>
              ))}

              {calculated && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Criteria passed</span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {checklist.filter((c) => c.passed).length} / {checklist.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(checklist.filter((c) => c.passed).length / checklist.length) * 100}%`,
                        background: STATUS_CONFIG[result.status].color,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
