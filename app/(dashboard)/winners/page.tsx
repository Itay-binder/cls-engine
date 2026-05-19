'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy, TrendingUp, Hourglass, XCircle, ChevronDown, ChevronUp, Lightbulb,
  AlertTriangle, Settings,
} from 'lucide-react';
import { MetaConnectBanner } from '@/components/meta-connect-banner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = 'Winner' | 'Potential' | 'Failed' | 'Not Enough Signal';

interface NormalizedAd {
  id: string;
  name: string;
  status: string;
  thumbnail_url: string | null;
  creative_type: 'video' | 'image' | 'unknown';
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  roas: number;
}

interface EnrichedAd extends NormalizedAd {
  winnerStatus: StatusType;
}

// ─── Winner Detection ─────────────────────────────────────────────────────────
function classifyAd(ad: NormalizedAd): StatusType {
  if (ad.conversions >= 20 && ad.roas >= 2.5) return 'Winner';
  if (ad.conversions >= 10 && ad.roas >= 1.5) return 'Potential';
  if (ad.spend >= 500 && ad.conversions < 5) return 'Failed';
  return 'Not Enough Signal';
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  StatusType,
  { color: string; bg: string; variant: 'success' | 'secondary' | 'warning' | 'danger' }
> = {
  Winner: { color: '#22C55E', bg: '#22c55e15', variant: 'success' },
  Potential: { color: '#38BDF8', bg: '#38bdf815', variant: 'secondary' },
  'Not Enough Signal': { color: '#F59E0B', bg: '#f59e0b15', variant: 'warning' },
  Failed: { color: '#EF4444', bg: '#ef444415', variant: 'danger' },
};

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[var(--color-border)]/40',
        className
      )}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-danger)]/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-[var(--color-danger)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Meta API Unreachable</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Check that your Meta token is valid and the account is active.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/settings">
              <Settings className="w-4 h-4" />
              Go to Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label, count, icon: Icon, color, bg,
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

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#101624] border border-[#1e2d45] rounded-lg p-3 shadow-xl text-xs">
      <p className="text-[#94A3B8] mb-1 font-medium truncate max-w-[160px]">{label}</p>
      <p style={{ color: payload[0].fill }} className="font-semibold">
        ROAS: {payload[0].value.toFixed(2)}x
      </p>
    </div>
  );
}

// ─── Pattern Insights ─────────────────────────────────────────────────────────
function deriveInsights(ads: EnrichedAd[]) {
  const winners = ads.filter((a) => a.winnerStatus === 'Winner');

  // Avg winning ROAS
  const avgWinRoas =
    winners.length > 0
      ? winners.reduce((s, a) => s + a.roas, 0) / winners.length
      : 0;

  // Top creative type by avg ROAS among winners
  const typeMap = new Map<string, { total: number; count: number }>();
  for (const a of ads) {
    const t = a.creative_type;
    const curr = typeMap.get(t) ?? { total: 0, count: 0 };
    typeMap.set(t, { total: curr.total + a.roas, count: curr.count + 1 });
  }
  let topType = 'unknown';
  let topTypeRoas = 0;
  for (const [type, { total, count }] of typeMap.entries()) {
    const avg = total / count;
    if (avg > topTypeRoas) {
      topTypeRoas = avg;
      topType = type;
    }
  }

  // Best hook pattern: first ~30 chars of top ad name by ROAS
  const topAd = ads.reduce(
    (best, a) => (a.roas > (best?.roas ?? 0) ? a : best),
    ads[0]
  );
  const hookPreview = topAd ? topAd.name.slice(0, 32) : 'N/A';

  return {
    avgWinRoas: avgWinRoas.toFixed(2),
    topCreativeType: topType,
    topCreativeRoas: topTypeRoas.toFixed(2),
    hookPreview,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WinnersPage() {
  const [ads, setAds] = useState<EnrichedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaNotConfigured, setMetaNotConfigured] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/meta/ads?limit=50');
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          if (res.status === 503) {
            setMetaNotConfigured(true);
            return;
          }
          setError(body.error ?? `HTTP ${res.status}`);
          return;
        }
        const raw = (await res.json()) as NormalizedAd[];
        if (!Array.isArray(raw)) {
          setError('Unexpected response format from Meta API');
          return;
        }
        const enriched: EnrichedAd[] = raw.map((ad) => ({
          ...ad,
          winnerStatus: classifyAd(ad),
        }));
        setAds(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ads');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (metaNotConfigured) return <MetaConnectBanner fullScreen />;
  if (error) return <ErrorState message={error} />;

  // Summary counts
  const counts: Record<StatusType, number> = {
    Winner: 0,
    Potential: 0,
    'Not Enough Signal': 0,
    Failed: 0,
  };
  for (const ad of ads) counts[ad.winnerStatus]++;

  // Top 10 by ROAS for chart
  const chartData = [...ads]
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10)
    .map((ad) => ({
      name: ad.name.length > 18 ? `${ad.name.slice(0, 18)}…` : ad.name,
      roas: ad.roas,
      status: ad.winnerStatus,
    }));

  const insights = deriveInsights(ads);

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Winner Detection</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          A failed experiment is still market intelligence.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Winners" count={counts.Winner} icon={Trophy} color="#22C55E" bg="#22c55e15" />
        <SummaryCard label="Potential Winners" count={counts.Potential} icon={TrendingUp} color="#38BDF8" bg="#38bdf815" />
        <SummaryCard label="Not Enough Signal" count={counts['Not Enough Signal']} icon={Hourglass} color="#F59E0B" bg="#f59e0b15" />
        <SummaryCard label="Failed" count={counts.Failed} icon={XCircle} color="#EF4444" bg="#ef444415" />
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ROAS Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Top 10 Ads by ROAS</CardTitle>
            <CardDescription>Bars colored by winner classification</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-16">No data with ROAS yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e2d4540' }} />
                  <Bar dataKey="roas" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={STATUS_CONFIG[entry.status as StatusType]?.color ?? '#64748B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ads Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Ads</CardTitle>
            <CardDescription>Click a row to expand full creative details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {ads.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-16 px-4">
                No ads found in this account for the last 30 days.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {['Thumb', 'Ad Name', 'Status', 'CTR', 'CPC', 'Spend', 'Conv.', 'ROAS'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => {
                      const cfg = STATUS_CONFIG[ad.winnerStatus];
                      const isExpanded = expandedRow === ad.id;
                      return (
                        <>
                          <tr
                            key={ad.id}
                            onClick={() => setExpandedRow(isExpanded ? null : ad.id)}
                            className={cn(
                              'border-b border-[var(--color-border)] cursor-pointer transition-colors',
                              isExpanded
                                ? 'bg-[var(--color-accent-dim)]'
                                : 'hover:bg-[var(--color-card-hover)]'
                            )}
                          >
                            {/* Thumbnail */}
                            <td className="px-3 py-2.5">
                              {ad.thumbnail_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={ad.thumbnail_url}
                                  alt={ad.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-[var(--color-border)]"
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center"
                                  title="No thumbnail"
                                >
                                  <span className="text-[9px] text-[var(--color-text-muted)] font-medium uppercase">
                                    {ad.creative_type === 'video' ? 'VID' : 'IMG'}
                                  </span>
                                </div>
                              )}
                            </td>
                            {/* Name */}
                            <td className="px-3 py-2.5 max-w-[130px]">
                              <p className="font-medium text-[var(--color-text)] text-xs leading-tight truncate">
                                {ad.name}
                              </p>
                            </td>
                            {/* Status */}
                            <td className="px-3 py-2.5">
                              <Badge variant={cfg.variant} className="text-[10px] whitespace-nowrap">
                                {ad.winnerStatus}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--color-text)]">
                              {ad.ctr.toFixed(2)}%
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--color-text)]">
                              ${ad.cpc.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--color-text)]">
                              ${ad.spend.toFixed(0)}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--color-text)]">
                              {ad.conversions}
                            </td>
                            <td className="px-3 py-2.5 text-xs font-semibold text-[var(--color-text)]">
                              {ad.roas > 0 ? `${ad.roas.toFixed(2)}x` : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[var(--color-text-muted)]">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {isExpanded && (
                            <tr key={`${ad.id}-detail`} className="bg-[#0a0f1a]">
                              <td colSpan={9} className="px-4 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      Impressions
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                      {ad.impressions.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      Clicks
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                      {ad.clicks.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      CPM
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">
                                      ${ad.cpm.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      Creative Type
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-text)] capitalize">
                                      {ad.creative_type}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      Ad Status
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-text)] capitalize">
                                      {ad.status.toLowerCase()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                                      Ad ID
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)] font-mono">
                                      {ad.id}
                                    </p>
                                  </div>
                                  {ad.thumbnail_url && (
                                    <div className="col-span-2 sm:col-span-2">
                                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                                        Creative Preview
                                      </p>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ad.thumbnail_url}
                                        alt={ad.name}
                                        className="h-24 rounded-xl object-cover border border-[var(--color-border)]"
                                      />
                                    </div>
                                  )}
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
            )}
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
              <CardDescription>Computed from your real Meta ad data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Not enough data to derive patterns yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                  Top Creative Type
                </p>
                <p className="text-sm font-semibold mb-1 capitalize" style={{ color: '#38BDF8' }}>
                  {insights.topCreativeType} — avg ROAS {insights.topCreativeRoas}x
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Highest average return among all creative formats
                </p>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                  Best Hook Pattern
                </p>
                <p className="text-sm font-semibold mb-1 truncate" style={{ color: '#22C55E' }}>
                  &ldquo;{insights.hookPreview}&rdquo;
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Opening of your highest-ROAS ad
                </p>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                  Avg Winning ROAS
                </p>
                <p className="text-sm font-semibold mb-1" style={{ color: '#7C3AED' }}>
                  {insights.avgWinRoas}x
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Average return across {counts.Winner} classified winner{counts.Winner !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
