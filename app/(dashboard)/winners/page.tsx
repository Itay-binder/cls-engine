'use client';

import { useState } from 'react';
import {
  Trophy, TrendingUp, Hourglass, XCircle, ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type StatusType = 'Winner' | 'Potential' | 'Not Enough Signal' | 'Failed';

interface Creative {
  id: number;
  name: string;
  hypothesis: string;
  status: StatusType;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  signal: string;
  spend: number;
  conversions: number;
  impressions: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CREATIVES: Creative[] = [
  {
    id: 1,
    name: 'UGC Hook – Pain Aware',
    hypothesis: 'Problem-aware UGC angle targeting burnout',
    status: 'Winner',
    ctr: 4.2, cpc: 0.84, cpa: 18.40, roas: 4.8,
    signal: 'Strong', spend: 3200, conversions: 174, impressions: 381000,
  },
  {
    id: 2,
    name: 'Static – Transformation',
    hypothesis: 'Before/after social proof static image',
    status: 'Winner',
    ctr: 3.8, cpc: 0.91, cpa: 22.10, roas: 4.1,
    signal: 'Strong', spend: 2800, conversions: 127, impressions: 307000,
  },
  {
    id: 3,
    name: 'Video – Objection Handling',
    hypothesis: '60s video addressing top 3 objections',
    status: 'Potential',
    ctr: 3.1, cpc: 1.12, cpa: 29.80, roas: 3.2,
    signal: 'Growing', spend: 1400, conversions: 47, impressions: 125000,
  },
  {
    id: 4,
    name: 'Carousel – Features Deep',
    hypothesis: 'Feature-benefit carousel for warm audience',
    status: 'Potential',
    ctr: 2.9, cpc: 1.24, cpa: 33.60, roas: 2.7,
    signal: 'Growing', spend: 900, conversions: 27, impressions: 72500,
  },
  {
    id: 5,
    name: 'Static – Curiosity Gap',
    hypothesis: 'Curiosity-driven headline with no product reveal',
    status: 'Not Enough Signal',
    ctr: 2.4, cpc: 1.48, cpa: 42.00, roas: 2.1,
    signal: 'Low', spend: 420, conversions: 10, impressions: 28400,
  },
  {
    id: 6,
    name: 'UGC – Lifestyle Aspirational',
    hypothesis: 'Aspirational lifestyle angle cold traffic',
    status: 'Not Enough Signal',
    ctr: 1.9, cpc: 1.82, cpa: 58.50, roas: 1.6,
    signal: 'Low', spend: 310, conversions: 5, impressions: 16300,
  },
  {
    id: 7,
    name: 'Video – Hard Sell',
    hypothesis: 'Direct response hard sell cold audience',
    status: 'Failed',
    ctr: 0.9, cpc: 3.10, cpa: 98.00, roas: 0.8,
    signal: 'None', spend: 590, conversions: 6, impressions: 19000,
  },
  {
    id: 8,
    name: 'Static – Generic Brand',
    hypothesis: 'Brand awareness creative no CTA',
    status: 'Failed',
    ctr: 0.7, cpc: 4.20, cpa: 145.00, roas: 0.5,
    signal: 'None', spend: 430, conversions: 3, impressions: 10200,
  },
];

const CHART_DATA = CREATIVES.map((c) => ({
  name: c.name.split('–')[0].trim(),
  ctr: c.ctr,
  cpc: c.cpc,
  cpa: c.cpa,
  roas: c.roas,
}));

const STATUS_CONFIG: Record<StatusType, { color: string; bg: string; variant: 'success' | 'secondary' | 'warning' | 'danger' }> = {
  Winner: { color: '#22C55E', bg: '#22c55e15', variant: 'success' },
  Potential: { color: '#38BDF8', bg: '#38bdf815', variant: 'secondary' },
  'Not Enough Signal': { color: '#F59E0B', bg: '#f59e0b15', variant: 'warning' },
  Failed: { color: '#EF4444', bg: '#ef444415', variant: 'danger' },
};

const METRIC_KEYS = ['ctr', 'cpc', 'cpa', 'roas'] as const;
type MetricKey = typeof METRIC_KEYS[number];

const METRIC_LABELS: Record<MetricKey, string> = {
  ctr: 'CTR (%)',
  cpc: 'CPC ($)',
  cpa: 'CPA ($)',
  roas: 'ROAS (x)',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#101624] border border-[#1e2d45] rounded-lg p-3 shadow-xl text-xs">
      <p className="text-[#94A3B8] mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
          {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Status Summary Card ──────────────────────────────────────────────────────
function SummaryCard({
  label,
  count,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{count}</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WinnersPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('ctr');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const counts = {
    Winner: CREATIVES.filter((c) => c.status === 'Winner').length,
    Potential: CREATIVES.filter((c) => c.status === 'Potential').length,
    'Not Enough Signal': CREATIVES.filter((c) => c.status === 'Not Enough Signal').length,
    Failed: CREATIVES.filter((c) => c.status === 'Failed').length,
  };

  const barColor = (entry: any, index: number) => {
    const colors = ['#7C3AED', '#8B5CF6', '#38BDF8', '#22C55E', '#F59E0B', '#F59E0B', '#EF4444', '#EF4444'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Winner Detection</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          A failed experiment is still market intelligence.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Winners" count={counts.Winner} icon={Trophy} color="#22C55E" bg="#22c55e15" />
        <SummaryCard label="Potential Winners" count={counts.Potential} icon={TrendingUp} color="#38BDF8" bg="#38bdf815" />
        <SummaryCard label="Not Enough Signal" count={counts['Not Enough Signal']} icon={Hourglass} color="#F59E0B" bg="#f59e0b15" />
        <SummaryCard label="Failed" count={counts.Failed} icon={XCircle} color="#EF4444" bg="#ef444415" />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>Metrics Performance</CardTitle>
              <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricKey)}>
                <TabsList>
                  {METRIC_KEYS.map((k) => (
                    <TabsTrigger key={k} value={k} className="uppercase text-[10px] tracking-wide">
                      {k}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>Comparing {METRIC_LABELS[activeMetric]} across all creatives</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -16, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e2d4540' }} />
                <Bar dataKey={activeMetric} radius={[6, 6, 0, 0]}>
                  {CHART_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColor(null, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Winners Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Creatives & Hypotheses</CardTitle>
            <CardDescription>Click a row to expand full details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Creative', 'Status', 'CTR', 'CPC', 'ROAS', 'Signal'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {CREATIVES.map((c) => {
                    const cfg = STATUS_CONFIG[c.status];
                    const isExpanded = expandedRow === c.id;
                    return (
                      <>
                        <tr
                          key={c.id}
                          onClick={() => setExpandedRow(isExpanded ? null : c.id)}
                          className={cn(
                            'border-b border-[var(--color-border)] cursor-pointer transition-colors',
                            isExpanded
                              ? 'bg-[var(--color-accent-dim)]'
                              : 'hover:bg-[var(--color-card-hover)]'
                          )}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--color-text)] text-xs leading-tight max-w-[120px] truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 max-w-[120px] truncate">
                              {c.hypothesis}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.variant} className="text-[10px] whitespace-nowrap">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text)] text-xs font-medium">{c.ctr}%</td>
                          <td className="px-4 py-3 text-[var(--color-text)] text-xs">${c.cpc}</td>
                          <td className="px-4 py-3 text-[var(--color-text)] text-xs font-semibold">{c.roas}x</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: cfg.color }}
                            >
                              {c.signal}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[var(--color-text-muted)]">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${c.id}-detail`} className="bg-[#0a0f1a]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Spend</p>
                                  <p className="text-sm font-semibold text-[var(--color-text)]">${c.spend.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Conversions</p>
                                  <p className="text-sm font-semibold text-[var(--color-text)]">{c.conversions}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Impressions</p>
                                  <p className="text-sm font-semibold text-[var(--color-text)]">{c.impressions.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">CPA</p>
                                  <p className="text-sm font-semibold text-[var(--color-text)]">${c.cpa}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Hypothesis</p>
                                  <p className="text-xs text-[var(--color-text-secondary)]">{c.hypothesis}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Insights */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-[var(--color-accent-light)]" />
            </div>
            <div>
              <CardTitle>Pattern Insights</CardTitle>
              <CardDescription>Detected patterns from your winning experiments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Best Hook Type',
                value: 'Problem-aware angles',
                detail: 'Outperform aspirational hooks by 34% on CTR',
                color: '#22C55E',
              },
              {
                label: 'Creative Format',
                value: 'UGC converts 2.1x',
                detail: 'UGC outperforms static creative consistently',
                color: '#38BDF8',
              },
              {
                label: 'Best Sub-Market',
                value: 'Working professionals 35-55',
                detail: 'Highest LTV and lowest CPA in this segment',
                color: '#7C3AED',
              },
            ].map((insight) => (
              <div
                key={insight.label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{insight.label}</p>
                <p className="text-sm font-semibold mb-1" style={{ color: insight.color }}>{insight.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{insight.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
