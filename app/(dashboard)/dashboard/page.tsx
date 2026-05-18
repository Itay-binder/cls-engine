// Mission Control — Server Component
// Fetches real Supabase data server-side. Falls back to zero state for new users.

import { createClient } from '@/lib/supabase/server';
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
import { StatusDonut } from '@/components/dashboard/StatusDonut';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type HypothesisStatus = 'pending' | 'testing' | 'winner' | 'failed';
type ScaleStatus = 'Not Ready' | 'Needs Testing' | 'Winner Detected' | 'Ready to Scale';

interface HypothesisRow {
  id: string;
  hook: string;
  angle: string | null;
  hypothesis_status: HypothesisStatus;
  created_at: string;
}

interface DashboardData {
  hypothesisCount: number;
  assetCount: number;
  winnerCount: number;
  scaleScore: number | null;
  latestHypotheses: HypothesisRow[];
  statusDistribution: { pending: number; testing: number; winner: number; failed: number };
}

// ─── Scale Status helpers ─────────────────────────────────────────────────────

function resolveScaleStatus(score: number | null): ScaleStatus {
  if (score === null) return 'Not Ready';
  if (score >= 80) return 'Ready to Scale';
  if (score >= 60) return 'Winner Detected';
  if (score >= 30) return 'Needs Testing';
  return 'Not Ready';
}

const SCALE_CONFIG: Record<
  ScaleStatus,
  { color: string; bg: string; border: string; barColor: string; Icon: React.ElementType }
> = {
  'Not Ready': {
    color: 'text-[#EF4444]',
    bg: 'bg-[#ef444420]',
    border: 'border-[#EF4444]/20',
    barColor: '#EF4444',
    Icon: TrendingDown,
  },
  'Needs Testing': {
    color: 'text-[#F59E0B]',
    bg: 'bg-[#f59e0b20]',
    border: 'border-[#F59E0B]/20',
    barColor: '#F59E0B',
    Icon: Minus,
  },
  'Winner Detected': {
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38bdf820]',
    border: 'border-[#38BDF8]/20',
    barColor: '#38BDF8',
    Icon: Sparkles,
  },
  'Ready to Scale': {
    color: 'text-[#22C55E]',
    bg: 'bg-[#22c55e20]',
    border: 'border-[#22C55E]/20',
    barColor: '#22C55E',
    Icon: TrendingUp,
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HypothesisStatus }) {
  const styles: Record<HypothesisStatus, string> = {
    winner: 'bg-[#22c55e20] text-[#22C55E] border border-[#22C55E]/20',
    testing: 'bg-[#38bdf820] text-[#38BDF8] border border-[#38BDF8]/20',
    failed: 'bg-[#ef444420] text-[#EF4444] border border-[#EF4444]/20',
    pending: 'bg-[#1e2d45] text-[#64748B] border border-[#1e2d45]',
  };
  const labels: Record<HypothesisStatus, string> = {
    winner: 'Winner',
    testing: 'Testing',
    failed: 'Failed',
    pending: 'Pending',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  subtitle: string;
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
        <div className="mt-3">
          <span className="text-xs text-[#64748B]">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Scale Readiness Card ─────────────────────────────────────────────────────

function ScaleReadinessCard({
  scaleStatus,
  score,
}: {
  scaleStatus: ScaleStatus;
  score: number;
}) {
  const cfg = SCALE_CONFIG[scaleStatus];
  const StatusIcon = cfg.Icon;

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
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-4 py-3 border',
            cfg.bg,
            cfg.border
          )}
        >
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-5 w-5', cfg.color)} />
            <span className={cn('text-base font-bold', cfg.color)}>{scaleStatus}</span>
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', cfg.color)}>{score}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Readiness Score</span>
            <span className="text-xs font-medium text-[#F8FAFC]">{score} / 100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e2d45]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: cfg.barColor }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Market Discovery Card ────────────────────────────────────────────────────

function MarketDiscoveryCard({
  distribution,
  total,
}: {
  distribution: { pending: number; testing: number; winner: number; failed: number };
  total: number;
}) {
  const donutData = [
    { name: 'Testing', value: distribution.testing, color: '#38BDF8' },
    { name: 'Winner', value: distribution.winner, color: '#22C55E' },
    { name: 'Failed', value: distribution.failed, color: '#EF4444' },
    { name: 'Pending', value: distribution.pending, color: '#64748B' },
  ];

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
        <StatusDonut data={donutData} />
      </CardContent>
    </Card>
  );
}

// ─── Recent Experiments Table ─────────────────────────────────────────────────

function RecentExperimentsCard({ hypotheses }: { hypotheses: HypothesisRow[] }) {
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
              <CardDescription className="mt-0.5">Latest 5 hypotheses</CardDescription>
            </div>
          </div>
          <Link
            href="/discovery"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[#64748B] transition-colors hover:bg-[#101624] hover:text-[#F8FAFC]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {hypotheses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#64748B]">No experiments yet.</p>
            <Link
              href="/discovery"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#8B5CF6] hover:underline"
            >
              Generate your first hypotheses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#162034]">
                  {['Hypothesis', 'Angle', 'Status', 'Created'].map((col) => (
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
                {hypotheses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="group transition-colors duration-150 hover:bg-[#141d2e]"
                  >
                    <td className="py-3 pr-4">
                      <span className="line-clamp-2 text-sm text-[#F8FAFC] max-w-[260px] block">
                        {exp.hook}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#94A3B8] whitespace-nowrap">
                        {exp.angle ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={exp.hypothesis_status} />
                    </td>
                    <td className="py-3 text-sm text-[#64748B] whitespace-nowrap">
                      {new Date(exp.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quick Actions Card ───────────────────────────────────────────────────────

function QuickActionsCard({ winnerCount }: { winnerCount: number }) {
  const actions = [
    {
      label: 'Generate Hypotheses',
      icon: Lightbulb,
      primary: true,
      desc: 'Let AI find your next angle',
      href: '/discovery',
    },
    {
      label: 'Create Content',
      icon: ImageIcon,
      primary: false,
      desc: 'From winning hooks to creatives',
      href: '/creative',
    },
    {
      label: 'View Winners',
      icon: Trophy,
      primary: false,
      desc: winnerCount > 0 ? `${winnerCount} confirmed winner${winnerCount !== 1 ? 's' : ''} ready` : 'No winners yet — keep testing',
      href: '/winners',
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
            <Link
              key={action.label}
              href={action.href}
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
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      hypothesisCount: 0,
      assetCount: 0,
      winnerCount: 0,
      scaleScore: null,
      latestHypotheses: [],
      statusDistribution: { pending: 0, testing: 0, winner: 0, failed: 0 },
    };
  }

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const workspaceId = workspace?.id ?? null;

  if (!workspaceId) {
    return {
      hypothesisCount: 0,
      assetCount: 0,
      winnerCount: 0,
      scaleScore: null,
      latestHypotheses: [],
      statusDistribution: { pending: 0, testing: 0, winner: 0, failed: 0 },
    };
  }

  // Run all queries in parallel
  const [
    hypothesesCountResult,
    assetsCountResult,
    winnersCountResult,
    scaleScoreResult,
    latestHypothesesResult,
    statusDistResult,
  ] = await Promise.all([
    supabase
      .from('hypotheses')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabase
      .from('creative_assets')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabase
      .from('winners')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('detection_status', 'winner'),
    supabase
      .from('scale_scores')
      .select('score')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('hypotheses')
      .select('id, hook, angle, hypothesis_status, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('hypotheses')
      .select('hypothesis_status')
      .eq('workspace_id', workspaceId),
  ]);

  // Build status distribution
  const distribution = { pending: 0, testing: 0, winner: 0, failed: 0 };
  for (const row of statusDistResult.data ?? []) {
    const s = row.hypothesis_status as HypothesisStatus;
    if (s in distribution) distribution[s]++;
  }

  return {
    hypothesisCount: hypothesesCountResult.count ?? 0,
    assetCount: assetsCountResult.count ?? 0,
    winnerCount: winnersCountResult.count ?? 0,
    scaleScore: scaleScoreResult.data?.score ?? null,
    latestHypotheses: (latestHypothesesResult.data ?? []) as HypothesisRow[],
    statusDistribution: distribution,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await fetchDashboardData();
  const scaleStatus = resolveScaleStatus(data.scaleScore);
  const scaleScore = data.scaleScore ?? 0;
  const total = data.hypothesisCount;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const stats = [
    {
      label: 'Hypotheses Generated',
      value: data.hypothesisCount,
      icon: Lightbulb,
      color: 'text-[#8B5CF6]',
      bg: 'bg-[#7c3aed20]',
      subtitle: data.hypothesisCount === 0 ? 'None yet — start in Discovery' : `${data.statusDistribution.testing} in testing`,
    },
    {
      label: 'Creatives Ready',
      value: data.assetCount,
      icon: ImageIcon,
      color: 'text-[#38BDF8]',
      bg: 'bg-[#38bdf820]',
      subtitle: data.assetCount === 0 ? 'Generate from a hypothesis' : 'Saved to library',
    },
    {
      label: 'Experiments Running',
      value: data.statusDistribution.testing,
      icon: FlaskConical,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#f59e0b20]',
      subtitle: data.statusDistribution.testing === 0 ? 'No active tests yet' : 'Live now',
    },
    {
      label: 'Winners Detected',
      value: data.winnerCount,
      icon: Trophy,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22c55e20]',
      subtitle: data.winnerCount === 0 ? 'Keep testing to find winners' : 'Ready to scale',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A12]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Header */}
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

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <MarketDiscoveryCard
              distribution={data.statusDistribution}
              total={total}
            />
            <RecentExperimentsCard hypotheses={data.latestHypotheses} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <ScaleReadinessCard scaleStatus={scaleStatus} score={scaleScore} />
            <QuickActionsCard winnerCount={data.winnerCount} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm italic text-[#64748B]">
            &ldquo;A failed experiment is still market intelligence.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
