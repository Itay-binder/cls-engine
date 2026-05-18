'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Lightbulb,
  ImageIcon,
  FlaskConical,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  CalendarDays,
  Activity,
  DollarSign,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusType = 'Testing' | 'Winner' | 'Failed' | 'Pending';
type ScaleStatus = 'Not Ready' | 'Needs Testing' | 'Winner Detected' | 'Ready to Scale';

interface Experiment {
  id: string;
  hypothesis: string;
  angle: string;
  status: StatusType;
  hookScore: number;
  created: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const HYPOTHESIS_DISTRIBUTION = [
  { name: 'Testing', value: 5, color: '#38BDF8' },
  { name: 'Winner', value: 3, color: '#22C55E' },
  { name: 'Failed', value: 4, color: '#EF4444' },
  { name: 'Pending', value: 6, color: '#64748B' },
];

const EXPERIMENTS: Experiment[] = [
  {
    id: '1',
    hypothesis: 'Pain-led hook outperforms aspiration in cold audiences',
    angle: 'Problem Awareness',
    status: 'Winner',
    hookScore: 9.2,
    created: 'May 14, 2026',
  },
  {
    id: '2',
    hypothesis: 'Social proof from niche peers converts better than general testimonials',
    angle: 'Trust / Authority',
    status: 'Testing',
    hookScore: 7.8,
    created: 'May 16, 2026',
  },
  {
    id: '3',
    hypothesis: 'Price anchoring to daily cost reduces checkout friction',
    angle: 'Objection Handling',
    status: 'Testing',
    hookScore: 6.5,
    created: 'May 17, 2026',
  },
  {
    id: '4',
    hypothesis: 'Video > static for cold traffic on Meta at $497+ price point',
    angle: 'Format Test',
    status: 'Failed',
    hookScore: 3.1,
    created: 'May 10, 2026',
  },
  {
    id: '5',
    hypothesis: 'Urgency deadline in VSL increases same-session conversions',
    angle: 'Scarcity / CTA',
    status: 'Pending',
    hookScore: 0,
    created: 'May 18, 2026',
  },
];

const SCALE_STATUS: ScaleStatus = 'Winner Detected';

const LTV_DATA = {
  estimatedLTV: 2840,
  cac: 420,
  gap: 2420,
  ltvCacRatio: 6.8,
};

const STATS = [
  {
    label: 'Hypotheses Generated',
    value: 18,
    icon: Lightbulb,
    trend: '+4 this week',
    trendUp: true as boolean | null,
    color: 'text-[#8B5CF6]',
    bg: 'bg-[#7c3aed20]',
  },
  {
    label: 'Creatives Ready',
    value: 12,
    icon: ImageIcon,
    trend: '3 in review',
    trendUp: null as boolean | null,
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38bdf820]',
  },
  {
    label: 'Experiments Running',
    value: 5,
    icon: FlaskConical,
    trend: 'Live now',
    trendUp: null as boolean | null,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#f59e0b20]',
  },
  {
    label: 'Winners Detected',
    value: 3,
    icon: Trophy,
    trend: '+1 since Monday',
    trendUp: true as boolean | null,
    color: 'text-[#22C55E]',
    bg: 'bg-[#22c55e20]',
  },
];

// ─── Scale Status Config ──────────────────────────────────────────────────────

const SCALE_CONFIG: Record<
  ScaleStatus,
  {
    color: string;
    bg: string;
    border: string;
    barColor: string;
    score: number;
    Icon: React.ElementType;
  }
> = {
  'Not Ready': {
    color: 'text-[#EF4444]',
    bg: 'bg-[#ef444420]',
    border: 'border-[#EF4444]/20',
    barColor: '#EF4444',
    score: 18,
    Icon: TrendingDown,
  },
  'Needs Testing': {
    color: 'text-[#F59E0B]',
    bg: 'bg-[#f59e0b20]',
    border: 'border-[#F59E0B]/20',
    barColor: '#F59E0B',
    score: 42,
    Icon: Minus,
  },
  'Winner Detected': {
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38bdf820]',
    border: 'border-[#38BDF8]/20',
    barColor: '#38BDF8',
    score: 71,
    Icon: Sparkles,
  },
  'Ready to Scale': {
    color: 'text-[#22C55E]',
    bg: 'bg-[#22c55e20]',
    border: 'border-[#22C55E]/20',
    barColor: '#22C55E',
    score: 94,
    Icon: TrendingUp,
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusType }) {
  const styles: Record<StatusType, string> = {
    Winner: 'bg-[#22c55e20] text-[#22C55E] border border-[#22C55E]/20',
    Testing: 'bg-[#38bdf820] text-[#38BDF8] border border-[#38BDF8]/20',
    Failed: 'bg-[#ef444420] text-[#EF4444] border border-[#EF4444]/20',
    Pending: 'bg-[#1e2d45] text-[#64748B] border border-[#1e2d45]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass rounded-xl border border-[#1e2d45] px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-sm font-medium text-[#F8FAFC]">{item.name}</span>
        <span className="text-sm text-[#64748B]">{item.value}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean | null;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#64748B]">{label}</span>
            <span className="text-3xl font-bold tabular-nums text-[#F8FAFC]">{value}</span>
          </div>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', bg)}>
            <Icon className={cn('h-4 w-4', color)} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {trendUp === true && <TrendingUp className="h-3 w-3 text-[#22C55E]" />}
          {trendUp === false && <TrendingDown className="h-3 w-3 text-[#EF4444]" />}
          <span
            className={cn(
              'text-xs',
              trendUp === true
                ? 'text-[#22C55E]'
                : trendUp === false
                  ? 'text-[#EF4444]'
                  : 'text-[#64748B]'
            )}
          >
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Market Discovery Chart ───────────────────────────────────────────────────

function MarketDiscoveryCard() {
  const total = HYPOTHESIS_DISTRIBUTION.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed20]">
            <Target className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <div>
            <CardTitle>Market Discovery Status</CardTitle>
            <CardDescription className="mt-0.5">{total} hypotheses tracked</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={HYPOTHESIS_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {HYPOTHESIS_DISTRIBUTION.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with mini bars */}
          <div className="flex flex-col gap-3 flex-1">
            {HYPOTHESIS_DISTRIBUTION.map((item) => {
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-[#94A3B8]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-[#F8FAFC]">
                        {item.value}
                      </span>
                      <span className="text-xs text-[#64748B]">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e2d45]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Experiments Table ─────────────────────────────────────────────────

function RecentExperimentsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b20]">
              <FlaskConical className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <CardTitle>Recent Experiments</CardTitle>
              <CardDescription className="mt-0.5">Last 5 hypotheses tested</CardDescription>
            </div>
          </div>
          <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[#64748B] transition-colors hover:bg-[#101624] hover:text-[#F8FAFC]">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#162034]">
                {['Hypothesis', 'Angle', 'Status', 'Hook Score', 'Created'].map((col) => (
                  <th
                    key={col}
                    className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-widest text-[#64748B] last:pr-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162034]">
              {EXPERIMENTS.map((exp) => (
                <tr key={exp.id} className="group transition-colors duration-150 hover:bg-[#141d2e]">
                  <td className="py-3 pr-4">
                    <span className="line-clamp-2 text-sm text-[#F8FAFC] max-w-[260px] block">
                      {exp.hypothesis}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[#94A3B8] whitespace-nowrap">{exp.angle}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        exp.hookScore >= 8
                          ? 'text-[#22C55E]'
                          : exp.hookScore >= 5
                            ? 'text-[#F59E0B]'
                            : exp.hookScore === 0
                              ? 'text-[#64748B]'
                              : 'text-[#EF4444]'
                      )}
                    >
                      {exp.hookScore === 0 ? '—' : exp.hookScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-[#64748B] whitespace-nowrap">{exp.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Scale Readiness Card ─────────────────────────────────────────────────────

function ScaleReadinessCard() {
  const cfg = SCALE_CONFIG[SCALE_STATUS];
  const StatusIcon = cfg.Icon;

  const metrics = [
    { label: 'Hook Score Avg', value: '7.4 / 10', good: true },
    { label: 'Winners Found', value: '3', good: true },
    { label: 'CAC Validated', value: 'Partial', good: false },
    { label: 'Scaling Risk', value: 'Medium', good: false },
  ];

  return (
    <Card className={cn('border', cfg.border)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', cfg.bg)}>
            <BarChart3 className={cn('h-4 w-4', cfg.color)} />
          </div>
          <CardTitle>Scale Readiness</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Status pill */}
        <div className={cn('flex items-center justify-between rounded-xl px-4 py-3 border', cfg.bg, cfg.border)}>
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-5 w-5', cfg.color)} />
            <span className={cn('text-base font-bold', cfg.color)}>{SCALE_STATUS}</span>
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', cfg.color)}>{cfg.score}</span>
        </div>

        {/* Score bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Readiness Score</span>
            <span className="text-xs font-medium text-[#F8FAFC]">{cfg.score} / 100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e2d45]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${cfg.score}%`, backgroundColor: cfg.barColor }}
            />
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-0.5 rounded-lg bg-[#141d2e] px-3 py-2"
            >
              <span className="text-xs text-[#64748B]">{m.label}</span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  m.good ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                )}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── LTV Gap Card ─────────────────────────────────────────────────────────────

function LtvGapCard() {
  const { estimatedLTV, cac, gap, ltvCacRatio } = LTV_DATA;
  const cacPct = Math.round((cac / estimatedLTV) * 100);
  const gapPct = Math.round((gap / estimatedLTV) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e20]">
            <DollarSign className="h-4 w-4 text-[#22C55E]" />
          </div>
          <div>
            <CardTitle>LTV Gap</CardTitle>
            <CardDescription className="mt-0.5">Unit economics snapshot</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* LTV vs CAC */}
        <div className="flex items-end justify-between rounded-xl bg-[#141d2e] px-4 py-3 border border-[#162034]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#64748B]">Estimated LTV</span>
            <span className="text-2xl font-bold tabular-nums text-[#F8FAFC]">
              ${estimatedLTV.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-[#64748B]">CAC</span>
            <span className="text-2xl font-bold tabular-nums text-[#EF4444]">
              ${cac.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Gap row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#64748B]">Profit per customer</span>
            <span className="text-xl font-bold tabular-nums text-[#22C55E]">
              +${gap.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-[#64748B]">LTV:CAC ratio</span>
            <span
              className={cn(
                'text-xl font-bold tabular-nums',
                ltvCacRatio >= 3 ? 'text-[#22C55E]' : 'text-[#F59E0B]'
              )}
            >
              {ltvCacRatio.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Visual bar */}
        <div className="flex flex-col gap-1">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#1e2d45]">
            <div
              className="h-full bg-[#EF4444] transition-all duration-700"
              style={{ width: `${cacPct}%` }}
            />
            <div className="h-full flex-1 bg-gradient-to-r from-[#22C55E]/60 to-[#22C55E]" />
          </div>
          <div className="flex justify-between text-xs text-[#64748B]">
            <span>CAC ({cacPct}%)</span>
            <span>Profit ({gapPct}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Actions Card ───────────────────────────────────────────────────────

function QuickActionsCard() {
  const actions = [
    {
      label: 'Generate Hypotheses',
      icon: Lightbulb,
      primary: true,
      desc: 'Let AI find your next angle',
    },
    {
      label: 'Create Content',
      icon: ImageIcon,
      primary: false,
      desc: 'From winning hooks to creatives',
    },
    {
      label: 'View Winners',
      icon: Trophy,
      primary: false,
      desc: '3 confirmed winners ready',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed20]">
            <Zap className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <CardTitle>Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                action.primary
                  ? 'border-[#7C3AED]/30 bg-gradient-to-r from-[#7c3aed20] to-transparent hover:border-[#7C3AED]/50 hover:from-[#7c3aed30]'
                  : 'border-[#1e2d45] bg-transparent hover:border-[#7C3AED]/30 hover:bg-[#141d2e]'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  action.primary
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#141d2e] text-[#94A3B8] group-hover:text-[#8B5CF6]'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0">
                <span
                  className={cn(
                    'text-sm font-medium',
                    action.primary ? 'text-[#8B5CF6]' : 'text-[#F8FAFC]'
                  )}
                >
                  {action.label}
                </span>
                <span className="text-xs text-[#64748B]">{action.desc}</span>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[#64748B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8B5CF6]" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#070A12]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] shadow-lg shadow-[#7C3AED]/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Mission Control</h1>
              <p className="text-sm italic text-[#64748B]">The market is still teaching us.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#1e2d45] bg-[#101624] px-4 py-2 self-start">
            <CalendarDays className="h-3.5 w-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">{today}</span>
          </div>
        </div>

        {/* ── Top stat cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <MarketDiscoveryCard />
            <RecentExperimentsCard />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <ScaleReadinessCard />
            <LtvGapCard />
            <QuickActionsCard />
          </div>
        </div>

        {/* ── Footer quote ── */}
        <div className="mt-10 text-center">
          <p className="text-sm italic text-[#64748B]">
            "A failed experiment is still market intelligence."
          </p>
        </div>
      </div>
    </div>
  );
}
